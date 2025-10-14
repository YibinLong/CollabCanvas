/**
 * Authentication Middleware (PR #17)
 * 
 * WHY: We need to identify which user is making each request so we can
 * return only their documents and enforce ownership rules.
 * 
 * WHAT: This middleware extracts the user ID from the request and attaches
 * it to the request object for use in controllers.
 * 
 * CURRENT (Phase 4): Uses x-user-id header (simple mock auth for testing)
 * FUTURE (Phase 5): Will validate JWT tokens from Supabase Auth
 * 
 * HOW IT WORKS:
 * 1. Extract user ID from request header
 * 2. Attach it to req.userId
 * 3. Call next() to pass control to the route handler
 */

import { Request, Response, NextFunction } from 'express';

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
 * Real Authentication Middleware (will be implemented in Phase 5)
 * 
 * WHY: In production, we need to validate JWT tokens from Supabase Auth
 * to ensure users are who they claim to be.
 * 
 * HOW IT WILL WORK:
 * 1. Extract JWT from Authorization header
 * 2. Verify JWT with Supabase
 * 3. Extract user ID from verified token
 * 4. Attach to req.userId
 * 5. Call next()
 * 
 * For now, this is a placeholder. We'll implement it in Phase 5.
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
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'No token provided' });
    }

    const token = authHeader.substring(7); // Remove "Bearer " prefix

    // TODO (Phase 5): Verify token with Supabase
    // const { data, error } = await supabase.auth.getUser(token);
    // if (error) throw error;
    // (req as any).userId = data.user.id;

    // For now, just fail - this will be implemented in Phase 5
    return res.status(501).json({ 
      error: 'JWT authentication not implemented yet (Phase 5)' 
    });

    // next(); // Will be uncommented in Phase 5
  } catch (error) {
    console.error('Auth error:', error);
    res.status(401).json({ error: 'Invalid token' });
  }
}

