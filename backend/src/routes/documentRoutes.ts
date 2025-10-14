/**
 * Document Routes (PR #17)
 * 
 * WHY: Routes define the HTTP endpoints (URLs) that clients can call.
 * They connect URLs to controller functions.
 * 
 * WHAT: This file defines all document-related endpoints:
 * - GET    /api/documents       → List all documents
 * - POST   /api/documents       → Create a new document
 * - GET    /api/documents/:id   → Get a specific document
 * - DELETE /api/documents/:id   → Delete a document
 * 
 * HOW: Express Router lets us define routes in a modular way.
 * We apply auth middleware to all routes, then connect each route to its controller.
 */

import express from 'express';
import {
  listDocuments,
  createDocument,
  getDocument,
  deleteDocument,
  clearAllShapes,
} from '../controllers/documentController';
import { authenticateJWT } from '../middleware/auth';

/**
 * Create Express Router
 * 
 * WHY: Router lets us group related routes together and apply
 * middleware to all of them at once.
 */
const router = express.Router();

/**
 * Apply Authentication Middleware (PR #23 - UPDATED!)
 * 
 * WHY: All document routes require authentication. Applying middleware
 * here means every route below will check authentication automatically.
 * 
 * HOW: authenticateJWT validates JWT tokens from Supabase Auth and attaches
 * user ID to req.userId. If token is invalid/missing, request is rejected with 401.
 * 
 * PHASE 5: Changed from mockAuth to authenticateJWT ✅
 */
router.use(authenticateJWT);

/**
 * Document Routes
 * 
 * These connect HTTP methods + URLs to controller functions.
 * The controller functions contain the actual business logic.
 */

// GET /api/documents - List all documents for authenticated user
router.get('/', listDocuments);

// POST /api/documents - Create a new document
router.post('/', createDocument);

// GET /api/documents/:id - Get a specific document
// :id is a URL parameter that becomes req.params.id in the controller
router.get('/:id', getDocument);

// DELETE /api/documents/:id - Delete a document
router.delete('/:id', deleteDocument);

// POST /api/documents/:id/clear - Clear all shapes from a document
// WHY: Allows users to delete all shapes at once from the canvas
// This updates the database and syncs via Yjs to all connected users
router.post('/:id/clear', clearAllShapes);

/**
 * Export router as default
 * 
 * WHY: This lets us import and use these routes in server.ts like:
 * app.use('/api/documents', documentRoutes);
 */
export default router;

