/**
 * Main Server Entry Point
 * 
 * WHY: This is the starting point of the backend server. It sets up:
 * - Express app for REST API
 * - WebSocket server for real-time collaboration
 * - Database connection
 * - Middleware (CORS, security headers, etc.)
 * 
 * WHAT: When you run 'npm run dev', this file starts the server.
 */

import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import dotenv from 'dotenv';

// Load environment variables from .env file
dotenv.config();

const app = express();
const PORT = process.env.PORT || 4000;

/**
 * Middleware Setup
 * 
 * WHY: Middleware functions run on every request before reaching your routes.
 * They handle cross-cutting concerns like security, parsing, and logging.
 */

// Helmet: Adds security headers to protect against common vulnerabilities
app.use(helmet());

// CORS: Allows frontend to make requests to this backend
app.use(
  cors({
    origin: [
      'http://localhost:3000', // Local development frontend
      process.env.FRONTEND_URL || '', // Production frontend URL
    ],
    credentials: true, // Allow cookies for authentication
  })
);

// Body parser: Converts JSON request bodies into JavaScript objects
app.use(express.json());

// Request logging: Log every incoming request for debugging
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.path}`);
  next();
});

/**
 * Health Check Endpoint
 * 
 * WHY: Allows monitoring tools (and deployment platforms) to verify the server is running.
 * 
 * WHAT: Returns a simple JSON response with status information.
 */
app.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
  });
});

/**
 * Root Endpoint
 * 
 * WHY: Simple welcome message to confirm the API is accessible.
 */
app.get('/', (req, res) => {
  res.json({
    message: 'CollabCanvas API',
    version: '0.1.0',
    status: 'running',
  });
});

/**
 * API Routes
 * 
 * WHY: Organizes endpoints by feature (documents, AI, etc.)
 * WHAT: Will be added in future PRs:
 * - /api/documents - Document CRUD operations
 * - /api/ai - AI command interpretation
 */

// Placeholder for future routes
// app.use('/api/documents', documentRoutes);
// app.use('/api/ai', aiRoutes);

/**
 * Error Handling Middleware
 * 
 * WHY: Catches any errors that occur in routes and sends a proper response.
 * Prevents the server from crashing on errors.
 */
app.use(
  (
    err: Error,
    req: express.Request,
    res: express.Response,
    next: express.NextFunction
  ) => {
    console.error('Error:', err);
    res.status(500).json({
      error: 'Internal server error',
      message: process.env.NODE_ENV === 'development' ? err.message : undefined,
    });
  }
);

/**
 * Start Server
 * 
 * WHY: Begins listening for HTTP requests on the specified port.
 */
app.listen(PORT, () => {
  console.log(`\n🚀 Server running on http://localhost:${PORT}`);
  console.log(`📊 Health check: http://localhost:${PORT}/health`);
  console.log(`\n✓ Backend setup complete!\n`);
});

// Handle graceful shutdown
process.on('SIGTERM', () => {
  console.log('SIGTERM received, shutting down gracefully...');
  process.exit(0);
});

