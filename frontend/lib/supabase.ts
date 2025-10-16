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
    // Sanity check: Warn if environment variable is missing
    if (!process.env.NEXT_PUBLIC_API_URL) {
      console.error(
        '[API] ❌ NEXT_PUBLIC_API_URL is not set!\n' +
        '   API calls will fail. Fix: Add NEXT_PUBLIC_API_URL=http://localhost:4000 to frontend/.env.local'
      )
      return null
    }

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

/**
 * Helper: Clear All Shapes from a Document
 * 
 * WHY: Users need a way to delete all shapes at once from the canvas.
 * This is faster and more convenient than selecting and deleting shapes individually.
 * 
 * WHAT IT DOES:
 * 1. Gets the current auth token
 * 2. Calls backend /api/documents/:id/clear endpoint
 * 3. The backend clears the Yjs state in the database
 * 4. Yjs automatically syncs this change to all connected users
 * 
 * HOW IT WORKS:
 * - Backend sets yjsState to null in the database
 * - Yjs WebSocket server broadcasts this to all connected clients
 * - Each client's useYjsSync hook receives the update and clears local shapes
 * 
 * WHEN TO USE:
 * - When user clicks "Clear All" button in the toolbar
 * - To reset a canvas to a blank state
 * 
 * @param documentId - The document ID to clear shapes from
 * @returns Success/error response
 */
export async function clearAllShapes(documentId: string) {
  try {
    const token = await getAuthToken()

    if (!token) {
      console.error('No auth token available')
      return { success: false, error: 'Not authenticated' }
    }

    const response = await fetch(
      `${process.env.NEXT_PUBLIC_API_URL}/api/documents/${documentId}/clear`,
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      }
    )

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ error: 'Unknown error' }))
      console.error('Failed to clear shapes:', response.status, errorData)
      return { 
        success: false, 
        error: errorData.error || `Server error: ${response.status}` 
      }
    }

    const data = await response.json()
    console.log('✅ All shapes cleared successfully')
    return { success: true, message: data.message }
  } catch (error) {
    console.error('Error clearing shapes:', error)
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error' 
    }
  }
}

/**
 * Helper: Get Version History for a Document
 * 
 * WHY: Users need to see a list of all available versions to choose which one to restore.
 * 
 * WHAT IT DOES:
 * 1. Gets the current auth token
 * 2. Calls backend /api/documents/:id/versions endpoint
 * 3. Returns an array of version metadata (id, label, createdAt)
 * 
 * WHEN TO USE:
 * - When displaying the version history panel
 * - To show users all available restore points
 * 
 * @param documentId - The document ID to get versions for
 * @returns Array of version objects with id, label, and createdAt
 */
export async function getVersionHistory(documentId: string) {
  try {
    const token = await getAuthToken()

    if (!token) {
      console.error('No auth token available')
      return { success: false, error: 'Not authenticated', versions: [] }
    }

    const response = await fetch(
      `${process.env.NEXT_PUBLIC_API_URL}/api/documents/${documentId}/versions`,
      {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      }
    )

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ error: 'Unknown error' }))
      console.error('Failed to get version history:', response.status, errorData)
      return { 
        success: false, 
        error: errorData.error || `Server error: ${response.status}`,
        versions: []
      }
    }

    const data = await response.json()
    console.log('✅ Version history loaded:', data.versions.length, 'versions')
    return { success: true, versions: data.versions }
  } catch (error) {
    console.error('Error getting version history:', error)
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error',
      versions: []
    }
  }
}

/**
 * Helper: Restore a Previous Version
 * 
 * WHY: Users need to be able to roll back their document to a previous state.
 * This is essential for recovering from mistakes or undoing major changes.
 * 
 * WHAT IT DOES:
 * 1. Gets the current auth token
 * 2. Calls backend /api/documents/:id/versions/:versionId/restore endpoint
 * 3. The backend loads the version's Yjs state and updates the document
 * 4. Yjs automatically syncs this change to all connected users
 * 
 * HOW IT WORKS:
 * - Backend loads version from DocumentVersion table
 * - Updates main Document's yjsState with version's state
 * - Creates a new version snapshot marking the restore point
 * - Yjs WebSocket broadcasts the change to all clients
 * 
 * WHEN TO USE:
 * - When user clicks "Restore" on a version in the history panel
 * 
 * @param documentId - The document ID
 * @param versionId - The version ID to restore
 * @returns Success/error response
 */
export async function restoreVersion(documentId: string, versionId: string) {
  try {
    const token = await getAuthToken()

    if (!token) {
      console.error('No auth token available')
      return { success: false, error: 'Not authenticated' }
    }

    const response = await fetch(
      `${process.env.NEXT_PUBLIC_API_URL}/api/documents/${documentId}/versions/${versionId}/restore`,
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      }
    )

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ error: 'Unknown error' }))
      console.error('Failed to restore version:', response.status, errorData)
      return { 
        success: false, 
        error: errorData.error || `Server error: ${response.status}` 
      }
    }

    const data = await response.json()
    console.log('✅ Version restored successfully')
    return { success: true, message: data.message }
  } catch (error) {
    console.error('Error restoring version:', error)
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error' 
    }
  }
}

/**
 * Helper: Create a Manual Version Snapshot
 * 
 * WHY: Users may want to manually save a snapshot at important milestones
 * (e.g., "Before redesign", "Final version for review").
 * 
 * WHAT IT DOES:
 * 1. Gets the current auth token
 * 2. Serializes the current Yjs document state
 * 3. Calls backend /api/documents/:id/versions with the state and optional label
 * 4. Backend saves the provided state as a new version
 * 
 * WHY WE SEND STATE: The database might be stale. The Yjs WebSocket keeps the
 * document in memory and only saves to DB periodically. By sending the current
 * state from the client, we guarantee we're saving what's actually on the canvas.
 * 
 * @param documentId - The document ID
 * @param label - Optional description for the snapshot
 * @param yjsDoc - The Yjs document to save (optional, for when called from Canvas)
 * @returns Success/error response
 */
export async function createVersionSnapshot(documentId: string, label?: string, yjsDoc?: any) {
  try {
    const token = await getAuthToken()

    if (!token) {
      console.error('No auth token available')
      return { success: false, error: 'Not authenticated' }
    }

    // Serialize the Yjs document if provided
    let yjsStateBase64: string | undefined
    if (yjsDoc) {
      try {
        // Import Y namespace (needed for encoding)
        const Y = await import('yjs')
        const state = Y.encodeStateAsUpdate(yjsDoc)
        yjsStateBase64 = Buffer.from(state).toString('base64')
        console.log(`[Frontend] Sending ${state.length} bytes of Yjs state to backend`)
      } catch (error) {
        console.error('[Frontend] Failed to serialize Yjs doc:', error)
        // Continue without state - backend will use database as fallback
      }
    }

    const response = await fetch(
      `${process.env.NEXT_PUBLIC_API_URL}/api/documents/${documentId}/versions`,
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ label, yjsStateBase64 }),
      }
    )

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ error: 'Unknown error' }))
      console.error('Failed to create version snapshot:', response.status, errorData)
      return { 
        success: false, 
        error: errorData.error || `Server error: ${response.status}` 
      }
    }

    const data = await response.json()
    console.log('✅ Version snapshot created successfully')
    return { success: true, message: data.message }
  } catch (error) {
    console.error('Error creating version snapshot:', error)
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error' 
    }
  }
}

/**
 * Helper: Delete All Version History for a Document
 * 
 * WHY: Teams may want to clear the entire version history (cleanup, privacy).
 * 
 * WHAT IT DOES:
 * 1. Gets the current auth token
 * 2. Calls backend DELETE /api/documents/:id/versions endpoint
 * 3. Backend removes all DocumentVersion rows for the document
 * 
 * @param documentId - The document ID
 * @returns Success flag, message, and deletedCount when available
 */
export async function deleteAllVersions(documentId: string) {
  try {
    const token = await getAuthToken()

    if (!token) {
      console.error('No auth token available')
      return { success: false, error: 'Not authenticated', deletedCount: 0 }
    }

    const response = await fetch(
      `${process.env.NEXT_PUBLIC_API_URL}/api/documents/${documentId}/versions`,
      {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      }
    )

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ error: 'Unknown error' }))
      console.error('Failed to delete version history:', response.status, errorData)
      return {
        success: false,
        error: errorData.error || `Server error: ${response.status}`,
        deletedCount: 0,
      }
    }

    const data = await response.json()
    console.log('✅ Version history deleted successfully')
    return { success: true, message: data.message, deletedCount: data.deletedCount ?? 0 }
  } catch (error) {
    console.error('Error deleting version history:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      deletedCount: 0,
    }
  }
}

