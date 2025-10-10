import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import dotenv from 'dotenv';
import { connectDatabase } from './config/db';
import { FileSystemFabricator } from './config/fabrication';
import fileRoutes from './routes/fileRoutes';
import healthRoute from './routes/healthRoute';
import { errorHandler, notFoundHandler } from './middleware/errorHandler';
import { requestLogger, customLogger } from './middleware/logger';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;
const DATA_DIR = process.env.DATA_DIR || '/data';

const fabricator = new FileSystemFabricator(DATA_DIR);

app.use(helmet());
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:3000',
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
    try {
      await connectDatabase();
      console.log('MongoDB connected successfully');
    } catch (mongoError) {
      console.log('MongoDB connection failed, using file-based data generation...');
    }

    console.log('Creating fabricated file system...');
    await fabricator.createFabricatedFileSystem();
    console.log('Fabricated file system created successfully');

    // Start server with simple port-fallback logic: if the desired port is in use,
    // try the next one up to `maxAttempts` times. This prevents immediate crash
    // when a local process is already bound to the default port (EADDRINUSE).
    let currentPort = Number(PORT);
    const maxAttempts = 5;

    function attemptListen(port: number, attemptsLeft: number) {
      const server = app.listen(port, '0.0.0.0', () => {
        console.log(`Server running on port ${port}`);
        console.log(`Data directory: ${DATA_DIR}`);
        console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
        console.log(`MongoDB URI: ${process.env.MONGODB_URI || 'mongodb://localhost:27017/test-report-dashboard'}`);
      });

      server.on('error', (err: any) => {
        if (err && err.code === 'EADDRINUSE') {
          console.error(`Port ${port} is already in use.`);
          if (attemptsLeft > 0) {
            const nextPort = port + 1;
            console.log(`Attempting to listen on port ${nextPort} (${attemptsLeft} attempts left)...`);
            // small delay before retrying to avoid tight loop
            setTimeout(() => attemptListen(nextPort, attemptsLeft - 1), 250);
          } else {
            console.error(`No available ports found after ${maxAttempts} attempts. Exiting.`);
            process.exit(1);
          }
        } else {
          console.error('Server error:', err);
          process.exit(1);
        }
      });
    }

    attemptListen(currentPort, maxAttempts);
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
