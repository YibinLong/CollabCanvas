/**
 * Supabase Client Utility (PR #21)
 * 
 * WHY: We need a single, reusable Supabase client instance for the backend.
 * This client will handle authentication verification and database operations.
 * 
 * WHAT: Creates and exports a Supabase client configured with service role key.
 * The service role key allows backend to bypass Row Level Security (RLS) and
 * perform admin operations like verifying JWT tokens.
 * 
 * HOW: Uses createClient from @supabase/supabase-js with credentials from .env
 */

import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

/**
 * Validate Required Environment Variables
 * 
 * WHY: The app can't work without Supabase credentials. Fail fast if they're missing.
 */
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  throw new Error(
    'Missing Supabase credentials! Please set SUPABASE_URL and SUPABASE_SERVICE_KEY in .env'
  );
}

/**
 * Create Supabase Client
 * 
 * WHY: We use the SERVICE_KEY (not anon key) because:
 * 1. Backend needs to verify JWT tokens from frontend
 * 2. Backend needs full database access for admin operations
 * 3. Service key bypasses Row Level Security when needed
 * 
 * SECURITY: Never expose this client to the frontend! It has full admin access.
 */
export const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false, // Backend doesn't need auto-refresh
    persistSession: false,    // Backend doesn't persist sessions
  },
});

/**
 * Verify JWT Token
 * 
 * WHY: Helper function to validate JWT tokens sent from frontend.
 * This is used in the authenticateJWT middleware.
 * 
 * WHAT: Takes a JWT token string and verifies it with Supabase.
 * Returns user data if valid, throws error if invalid.
 * 
 * HOW: Uses supabase.auth.getUser() which validates the token internally.
 */
export async function verifyToken(token: string) {
  const { data, error } = await supabase.auth.getUser(token);
  
  if (error || !data.user) {
    throw new Error('Invalid or expired token');
  }
  
  return data.user;
}

/**
 * Get User by ID
 * 
 * WHY: Helper to fetch user details by ID (useful for admin operations)
 */
export async function getUserById(userId: string) {
  const { data, error } = await supabase.auth.admin.getUserById(userId);
  
  if (error || !data.user) {
    throw new Error('User not found');
  }
  
  return data.user;
}

