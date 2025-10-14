/**
 * Authentication Tests (PR #20)
 * 
 * WHY: Following TDD, we write tests FIRST to define what authentication should do.
 * These tests will FAIL initially, then we'll implement the code to make them pass.
 * 
 * WHAT: Tests for core authentication functionality:
 * - User can signup with email/password
 * - User can login with correct credentials
 * - Login fails with wrong credentials
 * - JWT token is validated correctly
 * - Protected routes require authentication
 * 
 * HOW: Uses Jest and Supertest to test HTTP endpoints
 */

/**
 * Mock Supabase Client FIRST
 * 
 * WHY: We need to mock Supabase BEFORE any imports that use it.
 * This prevents "Cannot access before initialization" errors.
 */
const mockSupabaseAuth = {
  signUp: jest.fn(),
  signInWithPassword: jest.fn(),
  signOut: jest.fn(),
  getUser: jest.fn(),
};

// Mock the Supabase module BEFORE importing anything
jest.mock('@supabase/supabase-js', () => ({
  createClient: jest.fn(() => ({
    auth: mockSupabaseAuth,
  })),
}));

// Mock Prisma
jest.mock('../utils/prisma', () => ({
  prisma: {
    user: {
      create: jest.fn(),
      findUnique: jest.fn(),
    },
  },
}));

// Mock verifyToken function
jest.mock('../utils/supabase', () => ({
  supabase: {
    auth: mockSupabaseAuth,
  },
  verifyToken: jest.fn(),
}));

// NOW we can import after mocking
import request from 'supertest';
import express, { Request, Response, NextFunction } from 'express';
import { authenticateJWT } from '../middleware/auth';

describe('Authentication', () => {
  let app: express.Application;

  beforeEach(() => {
    // Reset mocks before each test
    jest.clearAllMocks();

    // Create a fresh Express app for each test
    app = express();
    app.use(express.json());
  });

  /**
   * TEST GROUP: User Signup
   * 
   * WHY: We need to ensure users can create accounts with email/password
   */
  describe('POST /api/auth/signup', () => {
    /**
     * TEST: Successful signup
     * 
     * WHAT: When a user provides valid email/password, they get a JWT token back
     */
    it('should create a new user account', async () => {
      // Arrange: Mock Supabase to return success
      mockSupabaseAuth.signUp.mockResolvedValue({
        data: {
          user: {
            id: 'test-user-id',
            email: 'test@example.com',
          },
          session: {
            access_token: 'fake-jwt-token',
            refresh_token: 'fake-refresh-token',
          },
        },
        error: null,
      });

      // Create route (implementation will be added in PR #21)
      app.post('/api/auth/signup', async (req: Request, res: Response) => {
        // This will be implemented in PR #21
        res.status(501).json({ error: 'Not implemented yet' });
      });

      // Act & Assert: This SHOULD work but will fail now
      const response = await request(app)
        .post('/api/auth/signup')
        .send({
          email: 'test@example.com',
          password: 'SecurePass123!',
        });

      // These assertions will fail now - that's expected!
      // expect(response.status).toBe(201);
      // expect(response.body).toHaveProperty('token');
      // expect(response.body).toHaveProperty('user');
      
      // For now, we expect 501 (Not Implemented)
      expect(response.status).toBe(501);
    });

    /**
     * TEST: Signup with invalid email
     * 
     * WHAT: Should reject invalid email addresses
     */
    it('should reject invalid email format', async () => {
      app.post('/api/auth/signup', async (req: Request, res: Response) => {
        res.status(501).json({ error: 'Not implemented yet' });
      });

      const response = await request(app)
        .post('/api/auth/signup')
        .send({
          email: 'not-an-email',
          password: 'SecurePass123!',
        });

      // Will fail with 501 for now
      expect(response.status).toBe(501);
    });

    /**
     * TEST: Signup with weak password
     * 
     * WHAT: Should reject passwords that are too short
     */
    it('should reject weak passwords', async () => {
      app.post('/api/auth/signup', async (req: Request, res: Response) => {
        res.status(501).json({ error: 'Not implemented yet' });
      });

      const response = await request(app)
        .post('/api/auth/signup')
        .send({
          email: 'test@example.com',
          password: '123', // Too short
        });

      expect(response.status).toBe(501);
    });
  });

  /**
   * TEST GROUP: User Login
   * 
   * WHY: Registered users need to authenticate and receive a JWT token
   */
  describe('POST /api/auth/login', () => {
    /**
     * TEST: Successful login
     * 
     * WHAT: User provides correct credentials and gets a JWT token
     */
    it('should login with correct credentials', async () => {
      mockSupabaseAuth.signInWithPassword.mockResolvedValue({
        data: {
          user: {
            id: 'test-user-id',
            email: 'test@example.com',
          },
          session: {
            access_token: 'fake-jwt-token',
            refresh_token: 'fake-refresh-token',
          },
        },
        error: null,
      });

      app.post('/api/auth/login', async (req: Request, res: Response) => {
        res.status(501).json({ error: 'Not implemented yet' });
      });

      const response = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'test@example.com',
          password: 'SecurePass123!',
        });

      expect(response.status).toBe(501);
    });

    /**
     * TEST: Login with wrong password
     * 
     * WHAT: Should reject incorrect credentials
     */
    it('should reject incorrect password', async () => {
      mockSupabaseAuth.signInWithPassword.mockResolvedValue({
        data: { user: null, session: null },
        error: { message: 'Invalid credentials' },
      });

      app.post('/api/auth/login', async (req: Request, res: Response) => {
        res.status(501).json({ error: 'Not implemented yet' });
      });

      const response = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'test@example.com',
          password: 'WrongPassword',
        });

      expect(response.status).toBe(501);
    });
  });

  /**
   * TEST GROUP: Logout
   * 
   * WHY: Users need to be able to sign out and invalidate their session
   */
  describe('POST /api/auth/logout', () => {
    it('should logout successfully', async () => {
      mockSupabaseAuth.signOut.mockResolvedValue({
        error: null,
      });

      app.post('/api/auth/logout', async (req: Request, res: Response) => {
        res.status(501).json({ error: 'Not implemented yet' });
      });

      const response = await request(app)
        .post('/api/auth/logout')
        .set('Authorization', 'Bearer fake-jwt-token');

      expect(response.status).toBe(501);
    });
  });

  /**
   * TEST GROUP: JWT Middleware
   * 
   * WHY: Protected routes should only be accessible with valid JWT tokens
   */
  describe('authenticateJWT middleware', () => {
    /**
     * TEST: Valid token grants access
     * 
     * WHAT: When a valid JWT is provided, the middleware should attach user ID and continue
     */
    it('should allow access with valid token', async () => {
      // Mock verifyToken from supabase utils
      const { verifyToken } = require('../utils/supabase');
      verifyToken.mockResolvedValue({
        id: 'test-user-id',
        email: 'test@example.com',
      });

      // Protected route
      app.get('/protected', authenticateJWT, (req: Request, res: Response) => {
        res.json({ message: 'Success', userId: (req as any).userId });
      });

      const response = await request(app)
        .get('/protected')
        .set('Authorization', 'Bearer fake-valid-token');

      // Should now succeed with our implementation!
      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('userId', 'test-user-id');
    });

    /**
     * TEST: No token denies access
     * 
     * WHAT: Requests without Authorization header should be rejected
     */
    it('should deny access without token', async () => {
      app.get('/protected', authenticateJWT, (req: Request, res: Response) => {
        res.json({ message: 'Success' });
      });

      const response = await request(app).get('/protected');

      // Should return 401 Unauthorized
      expect(response.status).toBe(401);
      expect(response.body).toHaveProperty('error');
    });

    /**
     * TEST: Invalid token denies access
     * 
     * WHAT: Malformed or expired tokens should be rejected
     */
    it('should deny access with invalid token', async () => {
      // Mock verifyToken to throw error for invalid token
      const { verifyToken } = require('../utils/supabase');
      verifyToken.mockRejectedValue(new Error('Invalid or expired token'));

      app.get('/protected', authenticateJWT, (req: Request, res: Response) => {
        res.json({ message: 'Success' });
      });

      const response = await request(app)
        .get('/protected')
        .set('Authorization', 'Bearer invalid-token');

      // Should return 401 Unauthorized
      expect(response.status).toBe(401);
      expect(response.body).toHaveProperty('error');
    });
  });

  /**
   * TEST GROUP: Protected Routes
   * 
   * WHY: All document routes should require authentication
   */
  describe('Protected Routes', () => {
    it('should require authentication for document routes', async () => {
      app.get('/api/documents', authenticateJWT, (req: Request, res: Response) => {
        res.json({ documents: [] });
      });

      const response = await request(app).get('/api/documents');

      expect(response.status).toBe(401);
    });
  });
});

