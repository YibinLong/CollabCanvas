/**
 * Auth Routes (PR #21)
 * 
 * WHY: Routes define the HTTP endpoints for authentication operations.
 * They connect URLs to controller functions.
 * 
 * WHAT: This file defines all auth-related endpoints:
 * - POST   /api/auth/signup       → Create new user account
 * - POST   /api/auth/login        → Authenticate user and get token
 * - POST   /api/auth/logout       → Sign out user
 * - GET    /api/auth/me           → Get current user info (protected)
 * 
 * HOW: Express Router lets us define routes in a modular way.
 */

import express from 'express';
import {
  signup,
  login,
  logout,
  getCurrentUser,
} from '../controllers/authController';
import { authenticateJWT } from '../middleware/auth';

/**
 * Create Express Router
 * 
 * WHY: Router lets us group related routes together
 */
const router = express.Router();

/**
 * Public Auth Routes
 * 
 * WHY: These routes don't require authentication (they ARE the authentication)
 */

// POST /api/auth/signup - Create new account
router.post('/signup', signup);

// POST /api/auth/login - Login with email/password
router.post('/login', login);

/**
 * Protected Auth Routes
 * 
 * WHY: These routes require valid JWT token
 */

// POST /api/auth/logout - Sign out (requires auth token)
router.post('/logout', authenticateJWT, logout);

// GET /api/auth/me - Get current user profile (requires auth token)
router.get('/me', authenticateJWT, getCurrentUser);

/**
 * Export router
 * 
 * WHY: This lets us import and use these routes in server.ts like:
 * app.use('/api/auth', authRoutes);
 */
export default router;

