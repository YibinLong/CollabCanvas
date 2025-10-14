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

/**
 * Helper: Sign Out (Global)
 * 
 * WHY: Signs out the user from ALL devices and browsers.
 * This terminates every active session for this user everywhere.
 * 
 * WHAT IT DOES:
 * - Destroys all refresh tokens in the database
 * - Clears session from localStorage
 * - Existing access tokens remain valid until they expire (usually 1 hour)
 * 
 * USE CASE: When you want to kick yourself (or someone) out everywhere,
 * like if you think your account was compromised or you shared your device.
 */
export async function signOutGlobal() {
  const { error } = await supabase.auth.signOut({ scope: 'global' });
  
  if (error) {
    console.error('Error signing out globally:', error);
    return { success: false, error };
  }
  
  console.log('✅ Signed out from all devices');
  return { success: true };
}

/**
 * Helper: Sign Out (Local Only)
 * 
 * WHY: Signs out only from the current browser/device.
 * Other sessions on other devices remain active.
 * 
 * USE CASE: Normal logout - user just wants to log out of this browser.
 */
export async function signOutLocal() {
  const { error } = await supabase.auth.signOut({ scope: 'local' });
  
  if (error) {
    console.error('Error signing out locally:', error);
    return { success: false, error };
  }
  
  console.log('✅ Signed out from this device');
  return { success: true };
}

/**
 * Helper: Sign Out (All Other Sessions)
 * 
 * WHY: Signs out from all devices EXCEPT the current one.
 * Keeps your current session active but kicks out all others.
 * 
 * USE CASE: If you see suspicious activity on other devices and want to
 * kick them out but stay logged in yourself.
 */
export async function signOutOthers() {
  const { error } = await supabase.auth.signOut({ scope: 'others' });
  
  if (error) {
    console.error('Error signing out other sessions:', error);
    return { success: false, error };
  }
  
  console.log('✅ Signed out from all other devices');
  return { success: true };
}

/**
 * Helper: Get User Metadata from Backend
 * 
 * WHY: Supabase Auth only stores email and id. We store additional 
 * metadata (name, avatarUrl) in our Prisma database. This function 
 * fetches that data from the backend.
 * 
 * WHAT IT DOES:
 * 1. Gets the current auth token
 * 2. Calls backend /api/auth/me endpoint
 * 3. Returns user metadata including name
 * 
 * WHEN TO USE: 
 * - After login to get the user's full profile
 * - When you need to display the user's name (instead of email)
 * 
 * @returns User metadata object with id, email, name, avatarUrl
 */
export async function getUserMetadata(accessToken?: string) {
  try {
    // Reuse provided token when available to avoid unnecessary refresh calls
    let token: string | null | undefined = accessToken

    if (!token) {
      token = await getAuthToken()
    }

    if (!token) {
      console.error('No auth token available')
      return null
    }

    const response = await fetch(
      `${process.env.NEXT_PUBLIC_API_URL}/api/auth/me`,
      {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      }
    )

    if (!response.ok) {
      console.error('Failed to fetch user metadata:', response.status, response.statusText)
      return null
    }

    const data = await response.json()
    return data.user
  } catch (error) {
    console.error('Error fetching user metadata:', error)
    return null
  }
}

