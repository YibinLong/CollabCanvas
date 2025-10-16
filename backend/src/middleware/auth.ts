/**
 * Authentication Middleware (PR #17, Updated in PR #21)
 * 
 * WHY: We need to identify which user is making each request so we can
 * return only their documents and enforce ownership rules.
 * 
 * WHAT: This middleware extracts the user ID from the request and attaches
 * it to the request object for use in controllers.
 * 
 * PHASE 4: mockAuth - Uses x-user-id header (simple mock auth for testing)
 * PHASE 5: authenticateJWT - Validates JWT tokens from Supabase Auth ✅
 * 
 * HOW IT WORKS:
 * 1. Extract user ID from request header (mockAuth) or JWT token (authenticateJWT)
 * 2. Attach it to req.userId
 * 3. Call next() to pass control to the route handler
 */

import { Request, Response, NextFunction } from 'express';
import { verifyToken } from '../utils/supabase';

/**
 * Mock Authentication Middleware
 * 
 * WHY: We need to test document APIs now, but Supabase Auth isn't set up yet.
 * This simple middleware lets us mock authentication using a header.
 * 
 * SECURITY NOTE: This is NOT secure! It's only for development and testing.
 * In Phase 5, we'll replace this with proper JWT validation.
 * 
 * USAGE: Frontend (or tests) send x-user-id header with each request.
 */
export function mockAuth(req: Request, res: Response, next: NextFunction) {
  // Extract user ID from header
  const userId = req.headers['x-user-id'] as string;

  // Attach to request object so controllers can access it
  (req as any).userId = userId;

  // Continue to next middleware/route handler
  next();
}

/**
 * Real Authentication Middleware (PR #21 - IMPLEMENTED!)
 * 
 * WHY: In production, we need to validate JWT tokens from Supabase Auth
 * to ensure users are who they claim to be.
 * 
 * HOW IT WORKS:
 * 1. Extract JWT from Authorization header
 * 2. Verify JWT with Supabase using verifyToken helper
 * 3. Extract user ID from verified token
 * 4. Attach to req.userId
 * 5. Call next() to continue to route handler
 * 
 * SECURITY: If token is missing, invalid, or expired, request is rejected with 401.
 */
export async function authenticateJWT(
  req: Request,
  res: Response,
  next: NextFunction
) {
  try {
    // Extract JWT from Authorization header
    // Format: "Bearer <token>"
    const authHeader = req.headers.authorization;
    
    // Debug logging
    console.log('🔐 Auth Debug:', {
      hasAuthHeader: !!authHeader,
      headerPreview: authHeader ? authHeader.substring(0, 30) + '...' : 'NONE',
      path: req.path,
    });
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      console.log('❌ Auth failed: No token provided');
      return res.status(401).json({ error: 'No token provided' });
    }

    const token = authHeader.substring(7); // Remove "Bearer " prefix

    // Verify token with Supabase using verifyToken helper
    const user = await verifyToken(token);
    
    console.log('✅ Auth success: User', user.id);
    
    // Attach user ID to request for use in controllers
    (req as any).userId = user.id;
    (req as any).user = user; // Also attach full user object for convenience

    // Continue to route handler
    next();
  } catch (error) {
    console.error('❌ Auth error:', error);
    res.status(401).json({ error: 'Invalid or expired token' });
  }
}

