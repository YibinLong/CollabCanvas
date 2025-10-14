/**
 * Supabase Client (Frontend) - PR #21
 * 
 * WHY: We need a Supabase client on the frontend to:
 * - Authenticate users (signup, login, logout)
 * - Get JWT tokens for API requests
 * - Track auth state changes
 * 
 * WHAT: Creates a Supabase client using the ANON key (public key).
 * The anon key is safe to expose in the frontend because it has limited permissions.
 * 
 * SECURITY: 
 * - Frontend uses ANON key (limited permissions)
 * - Backend uses SERVICE key (full permissions)
 * - Row Level Security (RLS) in Supabase protects data
 * 
 * HOW: Import this client in components that need authentication
 */

import { createClient } from '@supabase/supabase-js';

/**
 * Environment Variables
 * 
 * WHY: These are loaded from .env.local file
 * NEXT_PUBLIC_ prefix makes them available in the browser
 */
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

/**
 * Validate Environment Variables
 * 
 * WHY: Fail fast if Supabase is not configured
 * EXCEPT in test environment where we mock Supabase
 */
const isTestEnv = process.env.NODE_ENV === 'test' || process.env.JEST_WORKER_ID !== undefined

if (!isTestEnv && (!supabaseUrl || !supabaseAnonKey)) {
  throw new Error(
    'Missing Supabase environment variables! Please set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY in .env.local'
  );
}

// Use dummy values in test environment
const effectiveUrl = supabaseUrl || 'http://localhost:54321'
const effectiveKey = supabaseAnonKey || 'test-anon-key'

/**
 * Create Supabase Client
 * 
 * WHY: This client handles all authentication operations:
 * - signUp() - Create new user
 * - signInWithPassword() - Login
 * - signOut() - Logout
 * - onAuthStateChange() - Listen for auth state changes
 * - getSession() - Get current session/token
 * 
 * PERSISTENCE: Supabase automatically persists sessions to localStorage,
 * so users stay logged in across page refreshes.
 */
export const supabase = createClient(effectiveUrl, effectiveKey, {
  auth: {
    persistSession: true,       // Save session to localStorage
    autoRefreshToken: true,      // Automatically refresh expired tokens
    detectSessionInUrl: true,    // Handle OAuth redirects
  },
});

/**
 * Helper: Get Current Session
 * 
 * WHY: Convenient function to check if user is logged in
 * Returns session with user info and access_token
 */
export async function getCurrentSession() {
  const { data, error } = await supabase.auth.getSession();
  
  if (error) {
    console.error('Error getting session:', error);
    return null;
  }
  
  return data.session;
}

/**
 * Helper: Get Auth Token
 * 
 * WHY: Get JWT token to send with API requests
 * This token is sent in Authorization header: "Bearer <token>"
 */
export async function getAuthToken() {
  const { data, error } = await supabase.auth.refreshSession();

  if (error || !data.session) {
    console.error('Error refreshing session:', error);
    return null;
  }

  return data.session.access_token;
}

