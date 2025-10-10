# Test Report Dashboard - Backend

A lightweight Node.js/Express backend server for the Test Report Dashboard application. This service provides a RESTful API for browsing and interacting with fabricated test pipeline results.

## Features

- **File System Fabrication**: Creates a realistic test data structure on startup
- **RESTful API**: Clean endpoints for file operations
- **File Downloads**: Support for both individual files and folder archives
- **Security**: Path traversal protection and input validation
- **Health Monitoring**: Built-in health check endpoint
- **Docker Ready**: Containerized for easy deployment

## API Endpoints

### Health Check
- `GET /api/health` - Service health status

### File Operations
- `GET /api/list?path=<directory_path>` - List directory contents
- `GET /api/file?path=<file_path>` - Get file content
- `GET /api/download?path=<item_path>` - Download file or folder (as ZIP)
- `GET /api/info?path=<file_path>` - Get file information

## Quick Start

### Development
```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Run tests
npm test

# Generate test data
npm run generate-data
```

### Production
```bash
# Build the application
npm run build

# Start production server
npm start
```

### Docker
```bash
# Build image
docker build -t test-report-dashboard-backend .

# Run container
docker run -p 5000:5000 test-report-dashboard-backend
```

## Environment Variables

| Variable | Default | Description |
|----------|---------|-------------|
| `PORT` | `5000` | Server port |
| `NODE_ENV` | `development` | Environment mode |
| `DATA_DIR` | `/data` | Data directory path |
| `LOG_LEVEL` | `2` | Logging level (0-3) |
| `LOG_FILE` | - | Log file path (optional) |

## Project Structure

```
test-report-dashboard-backend/
├── server.ts                 # Main server file
├── package.json
├── tsconfig.json
├── Dockerfile
├── src/
│   ├── config/
│   │   ├── db.ts             # Database config (optional)
│   │   └── fabrication.ts    # File system fabrication
│   ├── controllers/
│   │   ├── fileController.ts  # File operation logic
│   │   └── index.ts
│   ├── middleware/
│   │   ├── errorHandler.ts   # Error handling
│   │   ├── asyncHandler.ts   # Async wrapper
│   │   └── logger.ts         # Request logging
│   ├── models/
│   │   ├── fileModel.ts      # File interfaces
│   │   └── directoryModel.ts # Directory interfaces
│   ├── routes/
│   │   ├── fileRoutes.ts     # File API routes
│   │   ├── healthRoute.ts    # Health check route
│   │   └── index.ts
│   ├── types/
│   │   ├── fileTypes.ts      # Type definitions
│   │   └── express.d.ts      # Express extensions
│   ├── utils/
│   │   ├── fileUtils.ts      # File operations
│   │   ├── zipHelper.ts      # Archive creation
│   │   └── logger.ts         # Logging utility
│   ├── data/
│   │   └── sample.txt        # Sample data
│   └── tests/
│       ├── setup.ts          # Test configuration
│       ├── routes/
│       │   └── fileRoutes.test.ts
│       └── utils.test.ts
└── scripts/
    └── generateFakeData.ts   # Data generation script
```

## API Documentation

### List Directory Contents
```http
GET /api/list?path=test_pipeline_results
```

**Response:**
```json
{
  "success": true,
  "data": {
    "items": [
      {
        "isFolder": true,
        "name": "job_12345",
        "path": "/test_pipeline_results/job_12345",
        "size": 4096,
        "lastModified": "2024-01-15T10:30:15.000Z"
      }
    ],
    "currentPath": "test_pipeline_results",
    "parentPath": ""
  }
}
```

### Get File Content
```http
GET /api/file?path=test_pipeline_results/job_12345/integration_test.log
```

**Response:** Plain text file content

### Download File/Folder
```http
GET /api/download?path=test_pipeline_results/job_12345
```

**Response:** 
- For files: File content with appropriate headers
- For folders: ZIP archive

### Get File Information
```http
GET /api/info?path=test_pipeline_results/job_12345/integration_test.log
```

**Response:**
```json
{
  "success": true,
  "data": {
    "name": "integration_test.log",
    "path": "test_pipeline_results/job_12345/integration_test.log",
    "size": 17851,
    "isDirectory": false,
    "isFile": true,
    "mimeType": "text/plain",
    "isTextFile": true,
    "lastModified": "2024-01-15T10:30:15.000Z",
    "created": "2024-01-15T10:30:15.000Z"
  }
}
```

## Testing

The project includes comprehensive test coverage:

```bash
# Run all tests
npm test

# Run tests in watch mode
npm run test:watch

# Generate coverage report
npm run test:coverage
```

## Error Handling

The API uses consistent error responses:

```json
{
  "success": false,
  "error": "Error message",
  "message": "Additional details"
}
```

Common HTTP status codes:
- `200` - Success
- `400` - Bad Request
- `404` - Not Found
- `500` - Internal Server Error

## Security Features

- **Path Traversal Protection**: Prevents access outside data directory
- **Input Validation**: Sanitizes all path parameters
- **CORS Configuration**: Configurable cross-origin requests
- **Helmet Security**: Security headers and protections
- **Rate Limiting**: Built-in request throttling

## Performance

- **Compression**: Gzip compression for responses
- **Caching**: Appropriate cache headers
- **Streaming**: Large file streaming support
- **Memory Efficient**: Optimized for large file operations

## Monitoring

The service includes built-in monitoring:

- Health check endpoint (`/api/health`)
- Request logging with Morgan
- Error tracking and reporting
- Performance metrics

## Development

### Code Style
- TypeScript for type safety
- ESLint for code quality
- Prettier for formatting
- Jest for testing

### Scripts
- `npm run dev` - Development server with hot reload
- `npm run build` - TypeScript compilation
- `npm run test` - Run test suite
- `npm run lint` - Code linting
- `npm run generate-data` - Create test data

## Deployment

### Docker
The service is containerized and ready for deployment:

```bash
# Build and run with Docker Compose
docker-compose up -d

# Or build manually
docker build -t test-report-dashboard-backend .
docker run -p 5000:5000 test-report-dashboard-backend
```

### Environment Configuration
Set appropriate environment variables for your deployment:

```bash
export NODE_ENV=production
export PORT=5000
export DATA_DIR=/data
export LOG_LEVEL=2
```

## License

MIT License - see LICENSE file for details.

