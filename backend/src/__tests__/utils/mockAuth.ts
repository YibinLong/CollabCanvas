/**
 * Mock Authentication Utilities for Backend Testing
 * 
 * Backend tests need to mock authentication middleware and JWT validation.
 */

import { Request, Response, NextFunction } from 'express'

/**
 * Mock user data for testing
 */
export const mockUser = {
  id: 'test-user-id-123',
  email: 'test@example.com',
  name: 'Test User',
  created_at: new Date('2024-01-01'),
}

/**
 * Mock authenticated request
 * 
 * WHY: Express middleware adds user data to the request object.
 * This creates a request object that looks like it came from an authenticated user.
 * 
 * USAGE in tests:
 *   const req = mockAuthenticatedRequest({ userId: 'user-123' })
 *   await yourController(req, res)
 */
export function mockAuthenticatedRequest(userData = mockUser): Partial<Request> {
  return {
    user: userData,
    headers: {
      authorization: `Bearer ${mockJWT}`,
    },
  }
}

/**
 * Mock JWT token for testing
 * 
 * WHY: Backend endpoints expect JWT tokens in the Authorization header.
 * This is a fake token that looks valid for testing.
 */
export const mockJWT = 'mock-jwt-token.test-payload.test-signature'

/**
 * Mock auth middleware
 * 
 * WHY: The real auth middleware validates tokens with Supabase.
 * This mock middleware instantly adds user data to the request,
 * skipping the actual validation during tests.
 * 
 * USAGE:
 *   app.use(mockAuthMiddleware)
 *   // Now all routes think the user is authenticated
 */
export function mockAuthMiddleware(req: Request, res: Response, next: NextFunction) {
  // Add mock user to request
  req.user = mockUser
  next()
}

/**
 * Mock auth middleware that rejects (for testing protected routes)
 * 
 * WHY: Some tests need to verify that unauthenticated requests are rejected.
 */
export function mockAuthMiddlewareReject(req: Request, res: Response, next: NextFunction) {
  res.status(401).json({ error: 'Unauthorized' })
}

/**
 * Helper to create Express mock objects
 * 
 * WHY: Express handlers need req, res, and next. This creates mock
 * versions with spy functions so you can verify they were called.
 * 
 * USAGE:
 *   const { req, res, next } = createExpressMocks()
 *   await yourMiddleware(req, res, next)
 *   expect(next).toHaveBeenCalled()
 */
export function createExpressMocks() {
  const req: Partial<Request> = {
    body: {},
    params: {},
    query: {},
    headers: {},
  }
  
  const res: Partial<Response> = {
    status: jest.fn().mockReturnThis(),
    json: jest.fn().mockReturnThis(),
    send: jest.fn().mockReturnThis(),
  }
  
  const next: NextFunction = jest.fn()
  
  return { req: req as Request, res: res as Response, next }
}

/**
 * Creates a mock Supabase client for backend
 * 
 * WHY: Backend uses Supabase to verify JWT tokens. This mock
 * returns successful verification without making network calls.
 */
export function createMockSupabaseClient() {
  return {
    auth: {
      getUser: jest.fn().mockResolvedValue({
        data: { user: mockUser },
        error: null,
      }),
      
      admin: {
        getUserById: jest.fn().mockResolvedValue({
          data: { user: mockUser },
          error: null,
        }),
      },
    },
  }
}

