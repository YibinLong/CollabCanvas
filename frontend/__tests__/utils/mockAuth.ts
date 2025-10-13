/**
 * Mock Authentication Utilities for Testing
 * 
 * These utilities help test components that require authentication
 * without needing real Supabase connections or user accounts.
 * 
 * WHY: Testing authentication usually requires real API calls and database
 * access. These mocks let us test auth-protected features in isolation.
 */

/**
 * Mock user object
 * 
 * WHY: Many components need user data. This represents what a real user
 * object looks like, but with test data.
 */
export const mockUser = {
  id: 'test-user-id-123',
  email: 'test@example.com',
  user_metadata: {
    name: 'Test User',
  },
  created_at: '2024-01-01T00:00:00.000Z',
}

/**
 * Mock authenticated session
 * 
 * WHY: Supabase returns a session object when a user is logged in.
 * This mock session includes a fake JWT token and user data.
 */
export const mockSession = {
  access_token: 'mock-jwt-token-abc123',
  refresh_token: 'mock-refresh-token-xyz789',
  expires_in: 3600,
  expires_at: Date.now() + 3600000,
  token_type: 'bearer',
  user: mockUser,
}

/**
 * Mock Supabase client
 * 
 * WHY: The real Supabase client makes network requests. This mock client
 * returns predefined responses instantly, making tests fast and predictable.
 * 
 * USAGE:
 *   const supabase = createMockSupabaseClient()
 *   const { data, error } = await supabase.auth.signIn({ email, password })
 *   expect(data.user).toEqual(mockUser)
 */
export function createMockSupabaseClient() {
  return {
    auth: {
      // Sign in returns success by default
      signIn: jest.fn().mockResolvedValue({
        data: { session: mockSession, user: mockUser },
        error: null,
      }),
      
      // Sign up returns success by default
      signUp: jest.fn().mockResolvedValue({
        data: { session: mockSession, user: mockUser },
        error: null,
      }),
      
      // Sign out returns success
      signOut: jest.fn().mockResolvedValue({
        error: null,
      }),
      
      // Get session returns mock session
      getSession: jest.fn().mockResolvedValue({
        data: { session: mockSession },
        error: null,
      }),
      
      // Get user returns mock user
      getUser: jest.fn().mockResolvedValue({
        data: { user: mockUser },
        error: null,
      }),
      
      // Subscribe to auth state changes
      onAuthStateChange: jest.fn((callback) => {
        // Immediately call with signed in state
        callback('SIGNED_IN', mockSession)
        
        // Return unsubscribe function
        return {
          data: { subscription: { unsubscribe: jest.fn() } },
        }
      }),
    },
  }
}

/**
 * Mock auth context value
 * 
 * WHY: Components often get auth state from a React Context. This mock
 * context value provides everything a component expects.
 * 
 * USAGE in tests:
 *   <AuthContext.Provider value={mockAuthContext}>
 *     <YourComponent />
 *   </AuthContext.Provider>
 */
export const mockAuthContext = {
  user: mockUser,
  session: mockSession,
  signIn: jest.fn().mockResolvedValue({ error: null }),
  signUp: jest.fn().mockResolvedValue({ error: null }),
  signOut: jest.fn().mockResolvedValue({ error: null }),
  loading: false,
}

/**
 * Mock auth context for unauthenticated state
 * 
 * WHY: You also need to test what happens when no user is logged in.
 */
export const mockAuthContextUnauthenticated = {
  user: null,
  session: null,
  signIn: jest.fn().mockResolvedValue({ error: null }),
  signUp: jest.fn().mockResolvedValue({ error: null }),
  signOut: jest.fn().mockResolvedValue({ error: null }),
  loading: false,
}

/**
 * Creates a mock JWT token for testing
 * 
 * WHY: Some backend tests need to send authorization headers.
 * This creates a fake but valid-looking JWT token.
 * 
 * @param userId - The user ID to encode in the token
 * @returns A mock JWT token string
 */
export function createMockJWT(userId: string = mockUser.id): string {
  // Real JWTs are base64-encoded JSON. This is a simplified mock.
  // In real tests, you might use a library like 'jsonwebtoken' to create valid tokens.
  const header = Buffer.from(JSON.stringify({ alg: 'HS256', typ: 'JWT' })).toString('base64')
  const payload = Buffer.from(JSON.stringify({ 
    sub: userId, 
    email: mockUser.email,
    exp: Math.floor(Date.now() / 1000) + 3600 
  })).toString('base64')
  const signature = 'mock-signature'
  
  return `${header}.${payload}.${signature}`
}

