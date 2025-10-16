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

import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import dotenv from 'dotenv';
import http from 'http';
import { createWebSocketServer, getServerStats } from './services/websocketServer';
import documentRoutes from './routes/documentRoutes';
import authRoutes from './routes/authRoutes';

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
// WHY: Browser security requires backend to explicitly allow frontend's domain
app.use(
  cors({
    origin: function (origin, callback) {
      // Allow requests with no origin (like mobile apps or Postman)
      if (!origin) return callback(null, true);
      
      // List of allowed origins
      const allowedOrigins = [
        'http://localhost:3000',  // Local development
        'http://localhost:4000',  // Local backend (for testing)
        process.env.FRONTEND_URL, // Main production URL
        'https://collab-canvas-gauntlet.vercel.app', // Vercel production
      ].filter(Boolean); // Remove undefined/empty values
      
      // Check if the origin is allowed
      if (allowedOrigins.indexOf(origin) !== -1 || origin.endsWith('.vercel.app')) {
        callback(null, true);
      } else {
        console.warn(`CORS: Blocked request from origin: ${origin}`);
        callback(new Error('Not allowed by CORS'));
      }
    },
    credentials: true, // Allow cookies for authentication
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  })
);

// Body parser: Converts JSON request bodies into JavaScript objects
// WHY 10MB limit: Version history sends serialized Yjs state in base64.
// With many shapes, this can exceed the default 100KB limit.
// 10MB is generous enough for even complex canvases with 1000+ shapes.
app.use(express.json({ limit: '10mb' }));

// Request logging: Log every incoming request for debugging
app.use((req: Request, res: Response, next: NextFunction) => {
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
app.get('/health', (req: Request, res: Response) => {
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
app.get('/', (req: Request, res: Response) => {
  res.json({
    message: 'CollabCanvas API',
    version: '0.1.0',
    status: 'running',
  });
});

/**
 * API Routes
 * 
 * WHY: Organizes endpoints by feature (documents, auth, AI, etc.)
 * WHAT: Each feature has its own router module:
 * - /api/auth - Authentication (signup, login, logout) (PR #21 ✅)
 * - /api/documents - Document CRUD operations (PR #17 ✅)
 * - /api/ai - AI command interpretation (Phase 6)
 */

// Authentication routes (PR #21)
app.use('/api/auth', authRoutes);

// Document management routes (PR #17)
app.use('/api/documents', documentRoutes);

// Future routes
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
 * 
 * PERSISTENCE ENABLED: Canvas state is now automatically saved to PostgreSQL:
 * - Loads saved state when users join a room
 * - Auto-saves every 10 seconds while users are editing
 * - Saves when the last user leaves a room
 * - Ensures work persists even if all users disconnect for days
 */
const wss = createWebSocketServer(httpServer, {
  pingInterval: 30000, // 30 seconds
  pongTimeout: 5000, // 5 seconds
  enablePersistence: true, // ✅ ENABLED - Canvas state persists to database
});

console.log('✓ WebSocket server initialized with persistence');

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

