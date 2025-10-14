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
import http from 'http';
import { createWebSocketServer, getServerStats } from './services/websocketServer';

// Load environment variables from .env file
dotenv.config();

const app = express();
const PORT = process.env.PORT || 4000;

/**
 * Create HTTP server
 * 
 * WHY: We need an HTTP server that both Express and WebSocket can share.
 * This allows them to run on the same port, which is cleaner and easier to deploy.
 */
const httpServer = http.createServer(app);

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
    websocket: getServerStats(),
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
 * Initialize WebSocket Server
 * 
 * WHY: Set up the WebSocket server for real-time collaboration BEFORE starting the HTTP server.
 * This ensures WebSocket connections can be accepted as soon as the server starts.
 */
const wss = createWebSocketServer(httpServer, {
  pingInterval: 30000, // 30 seconds
  pongTimeout: 5000, // 5 seconds
  enablePersistence: false, // Will be enabled in Phase 4
});

console.log('✓ WebSocket server initialized');

/**
 * Start Server
 * 
 * WHY: Begins listening for HTTP and WebSocket requests on the specified port.
 * 
 * IMPORTANT: We use httpServer.listen() instead of app.listen() because
 * the WebSocket server is attached to httpServer, not the Express app directly.
 */
httpServer.listen(PORT, () => {
  console.log(`\n🚀 Server running on http://localhost:${PORT}`);
  console.log(`🔌 WebSocket server running on ws://localhost:${PORT}`);
  console.log(`📊 Health check: http://localhost:${PORT}/health`);
  console.log(`\n✓ Backend setup complete!\n`);
});

/**
 * Handle graceful shutdown
 * 
 * WHY: When the server is stopped (Ctrl+C, deployment update, etc.),
 * we want to close all connections cleanly before exiting.
 */
process.on('SIGTERM', () => {
  console.log('SIGTERM received, shutting down gracefully...');
  
  // Close HTTP server (stops accepting new connections)
  httpServer.close(() => {
    console.log('HTTP server closed');
  });
  
  // Close WebSocket server
  wss.close(() => {
    console.log('WebSocket server closed');
    process.exit(0);
  });
});

process.on('SIGINT', () => {
  console.log('\nSIGINT received, shutting down gracefully...');
  
  httpServer.close(() => {
    console.log('HTTP server closed');
  });
  
  wss.close(() => {
    console.log('WebSocket server closed');
    process.exit(0);
  });
});

