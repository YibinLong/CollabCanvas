/**
 * User Type Definitions
 * 
 * WHY: Defines user data structure for authentication and presence.
 * 
 * WHAT: User info from Supabase Auth plus presence data for collaboration.
 */

export interface User {
  id: string;
  email: string;
  name?: string;
}

// Presence information for real-time collaboration
export interface UserPresence {
  userId: string;
  name: string;
  color: string; // Unique color for cursor and selections
  cursor?: {
    x: number;
    y: number;
  };
}

