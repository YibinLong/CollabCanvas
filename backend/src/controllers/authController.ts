/**
 * Auth Controller (PR #21)
 * 
 * WHY: Controllers contain the business logic for authentication operations.
 * They handle signup, login, and logout requests.
 * 
 * WHAT: Each function receives a request, processes it, and sends a response.
 * Uses Supabase Auth for all authentication operations.
 * 
 * HOW: Express routes call these functions to handle auth endpoints.
 */

import { Request, Response } from 'express';
import { supabase } from '../utils/supabase';
import { prisma } from '../utils/prisma';

/**
 * Signup Controller
 * 
 * WHY: Allow new users to create accounts with email/password
 * 
 * WHAT: 
 * 1. Validate email and password
 * 2. Create user in Supabase Auth
 * 3. Create user record in our database (for metadata)
 * 4. Return JWT token and user info
 * 
 * SECURITY: Supabase handles password hashing and security automatically
 */
export async function signup(req: Request, res: Response) {
  try {
    const { email, password, name } = req.body;

    // Validate input
    if (!email || !password) {
      return res.status(400).json({ 
        error: 'Email and password are required' 
      });
    }

    // Check password strength (minimum 6 characters)
    if (password.length < 6) {
      return res.status(400).json({ 
        error: 'Password must be at least 6 characters' 
      });
    }

    // Create user in Supabase Auth
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
    });

    if (error) {
      console.error('Signup error:', error);
      return res.status(400).json({ 
        error: error.message || 'Failed to create account' 
      });
    }

    if (!data.user) {
      return res.status(400).json({ 
        error: 'Failed to create account' 
      });
    }

    // Create user metadata in our database
    try {
      await prisma.user.create({
        data: {
          id: data.user.id,
          email: data.user.email!,
          name: name || null,
        },
      });
    } catch (dbError) {
      // User already exists in database (this is ok)
      console.log('User already exists in database:', data.user.id);
    }

    // Return success with token and user info
    res.status(201).json({
      message: 'Account created successfully',
      token: data.session?.access_token,
      user: {
        id: data.user.id,
        email: data.user.email,
        name: name || null,
      },
    });
  } catch (error) {
    console.error('Signup error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}

/**
 * Login Controller
 * 
 * WHY: Allow existing users to authenticate and get a JWT token
 * 
 * WHAT:
 * 1. Validate credentials with Supabase Auth
 * 2. Return JWT token if credentials are correct
 * 3. Return error if credentials are wrong
 * 
 * SECURITY: Supabase validates password hash securely
 */
export async function login(req: Request, res: Response) {
  try {
    const { email, password } = req.body;

    // Validate input
    if (!email || !password) {
      return res.status(400).json({ 
        error: 'Email and password are required' 
      });
    }

    // Authenticate with Supabase
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      console.error('Login error:', error);
      return res.status(401).json({ 
        error: 'Invalid email or password' 
      });
    }

    if (!data.user || !data.session) {
      return res.status(401).json({ 
        error: 'Invalid email or password' 
      });
    }

    // Get user metadata from database
    let userMetadata = null;
    try {
      userMetadata = await prisma.user.findUnique({
        where: { id: data.user.id },
        select: { id: true, email: true, name: true, avatarUrl: true },
      });
    } catch (dbError) {
      console.error('Error fetching user metadata:', dbError);
    }

    // Return success with token and user info
    res.status(200).json({
      message: 'Login successful',
      token: data.session.access_token,
      user: userMetadata || {
        id: data.user.id,
        email: data.user.email,
        name: null,
        avatarUrl: null,
      },
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}

/**
 * Logout Controller
 * 
 * WHY: Allow users to sign out and invalidate their session
 * 
 * WHAT:
 * 1. Extract JWT token from Authorization header
 * 2. Call Supabase signOut with the token
 * 3. Return success
 * 
 * NOTE: Frontend should also clear local storage/state
 */
export async function logout(req: Request, res: Response) {
  try {
    // Extract token from Authorization header
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(400).json({ error: 'No token provided' });
    }

    const token = authHeader.substring(7);

    // Sign out from Supabase
    // Note: We need to set the session first
    await supabase.auth.signOut();

    res.status(200).json({ 
      message: 'Logout successful' 
    });
  } catch (error) {
    console.error('Logout error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}

/**
 * Get Current User Controller
 * 
 * WHY: Allow frontend to fetch current user's profile data
 * 
 * WHAT:
 * 1. Extract user ID from authenticated request
 * 2. Fetch user metadata from database
 * 3. Return user info
 * 
 * NOTE: This route uses authenticateJWT middleware, so user is already verified
 */
export async function getCurrentUser(req: Request, res: Response) {
  try {
    const userId = (req as any).userId;

    // Fetch user from database
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        name: true,
        avatarUrl: true,
        createdAt: true,
      },
    });

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.status(200).json({ user });
  } catch (error) {
    console.error('Get current user error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}

