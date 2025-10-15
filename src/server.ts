import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import dotenv from 'dotenv';
import { connectDatabase } from './config/db';
import { createFabricatedFileSystem } from './config/fabrication';
import fileRoutes from './routes/fileRoutes';
import healthRoute from './routes/healthRoute';
import { errorHandler, notFoundHandler } from './middleware/errorHandler';
import { requestLogger, customLogger } from './middleware/logger';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;
const DATA_DIR = process.env.DATA_DIR || '/data';

// Allow multiple frontend origins (comma-separated) or default common localhost ports
const allowedOrigins = (
  process.env.FRONTEND_URLS ||
  process.env.FRONTEND_URL ||
  'http://localhost:5173'
)
  .split(',')
  .map(o => o.trim())
  .filter(Boolean);

app.use(helmet());
app.use(cors({
  origin: (origin, callback) => {
    if (!origin) return callback(null, true);
    if (allowedOrigins.includes(origin)) return callback(null, true);
    return callback(new Error('Not allowed by CORS'));
  },
  credentials: true
}));
// Handle preflight requests
app.options('*', cors({
  origin: (origin, callback) => {
    if (!origin) return callback(null, true);
    if (allowedOrigins.includes(origin)) return callback(null, true);
    return callback(new Error('Not allowed by CORS'));
  },
  credentials: true
}));
app.use(compression());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use(requestLogger);
app.use(customLogger);

app.use('/api', fileRoutes);
app.use('/api', healthRoute);

app.get('/', (req, res) => {
  res.json({
    message: 'Test Report Dashboard API',
    version: '1.0.0',
    endpoints: {
      health: '/api/health',
      list: '/api/list?path=<directory_path>',
      file: '/api/file?path=<file_path>',
      download: '/api/download?path=<item_path>',
      info: '/api/info?path=<file_path>',
      search: '/api/search?q=<query>',
      stats: '/api/stats?path=<path>'
    }
  });
});

app.use(notFoundHandler);
app.use(errorHandler);

async function startServer() {
  try {
    console.log('Connecting to MongoDB...');
    const mongoConnected = await connectDatabase();
    if (!mongoConnected) {
      console.log('MongoDB connection failed, using file-based data generation...');
    }

    console.log('Creating fabricated file system...');
    await createFabricatedFileSystem(DATA_DIR);
    console.log('Fabricated file system created successfully');

    const server = app.listen(Number(PORT), '0.0.0.0', () => {
      console.log(`Server running on port ${PORT}`);
      console.log(`Data directory: ${DATA_DIR}`);
      console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
      console.log(`MongoDB URI: ${process.env.MONGODB_URI || 'mongodb://localhost:27017/test-report-dashboard'}`);
    });

    server.on('error', (err: any) => {
      if (err && err.code === 'EADDRINUSE') {
        console.error(`Port ${PORT} is already in use. Please stop the process using it or set PORT to a different value.`);
      } else {
        console.error('Server error:', err);
      }
      process.exit(1);
    });
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
}

process.on('SIGTERM', () => {
  console.log('SIGTERM received, shutting down gracefully');
  process.exit(0);
});

process.on('SIGINT', () => {
  console.log('SIGINT received, shutting down gracefully');
  process.exit(0);
});

startServer();
