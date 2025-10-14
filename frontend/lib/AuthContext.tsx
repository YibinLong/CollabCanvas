/**
 * Auth Context Provider (PR #21)
 * 
 * WHY: We need to share authentication state across the entire app.
 * React Context lets any component access user info and auth functions.
 * 
 * WHAT: Provides:
 * - user: Current logged-in user (or null)
 * - loading: Whether auth state is being determined
 * - signup(): Function to create new account
 * - login(): Function to authenticate
 * - logout(): Function to sign out
 * 
 * HOW: Wrap your app with <AuthProvider>, then use useAuth() hook in any component.
 */

'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from './supabase';

/**
 * Type Definitions
 * 
 * WHY: TypeScript helps catch bugs by defining expected data shapes
 */
interface AuthContextType {
  user: User | null;              // Current user (null if logged out)
  session: Session | null;        // Current session with token
  loading: boolean;               // True while checking auth state
  signup: (email: string, password: string, name?: string) => Promise<void>;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
}

/**
 * Create Context
 * 
 * WHY: Context is like a "global state" that any component can access
 */
const AuthContext = createContext<AuthContextType | undefined>(undefined);

/**
 * Auth Provider Component
 * 
 * WHY: This wrapper component manages auth state and provides it to children
 * 
 * WHAT IT DOES:
 * 1. On mount: Check if user is already logged in
 * 2. Listen for auth state changes (login, logout, token refresh)
 * 3. Provide auth functions (signup, login, logout)
 * 4. Make everything available to child components
 */
export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  /**
   * Initialize Auth State
   * 
   * WHY: When app loads, check if user is already logged in
   * (Supabase persists session to localStorage)
   */
  useEffect(() => {
    // Check for existing session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      setLoading(false);
    });

    // Listen for auth state changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      setUser(session?.user ?? null);
      setLoading(false);
    });

    // Cleanup: Unsubscribe when component unmounts
    return () => subscription.unsubscribe();
  }, []);

  /**
   * Signup Function
   * 
   * WHY: Create new user account
   * 
   * HOW:
   * 1. Call Supabase signUp API
   * 2. If successful, call backend to create user metadata
   * 3. User state updates automatically via onAuthStateChange
   */
  const signup = async (email: string, password: string, name?: string) => {
    try {
      // Create user in Supabase Auth
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
      });

      if (error) throw error;

      // Call backend to create user metadata
      // (Backend will create User record in Prisma database)
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/auth/signup`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ email, password, name }),
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Signup failed');
      }
    } catch (error: any) {
      console.error('Signup error:', error);
      throw error;
    }
  };

  /**
   * Login Function
   * 
   * WHY: Authenticate existing user
   * 
   * HOW:
   * 1. Call Supabase signInWithPassword
   * 2. If successful, user state updates automatically
   * 3. Session token is stored in localStorage
   */
  const login = async (email: string, password: string) => {
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) throw error;
    } catch (error: any) {
      console.error('Login error:', error);
      throw error;
    }
  };

  /**
   * Logout Function
   * 
   * WHY: Sign out user and clear session
   * 
   * HOW:
   * 1. Call Supabase signOut
   * 2. Clears localStorage
   * 3. User state updates automatically to null
   */
  const logout = async () => {
    try {
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
    } catch (error: any) {
      console.error('Logout error:', error);
      throw error;
    }
  };

  /**
   * Provide Auth State to Children
   * 
   * WHY: Any child component can now use useAuth() to access this data
   */
  const value = {
    user,
    session,
    loading,
    signup,
    login,
    logout,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

/**
 * useAuth Hook
 * 
 * WHY: Convenient hook to access auth state in any component
 * 
 * USAGE:
 * ```
 * const { user, login, logout } = useAuth();
 * 
 * if (user) {
 *   return <div>Welcome {user.email}!</div>
 * }
 * ```
 */
export function useAuth() {
  const context = useContext(AuthContext);
  
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  
  return context;
}

