/**
 * Jest Setup File for Backend
 * 
 * This file runs once before all tests. It sets up global test configuration,
 * mocks, and utilities that all tests can use.
 */

/**
 * Set up test environment variables
 * 
 * These override any .env file values during testing.
 * This ensures tests run in a consistent, isolated environment.
 */
process.env.NODE_ENV = 'test'
process.env.DATABASE_URL = process.env.DATABASE_URL || 'postgresql://test:test@localhost:5432/test'
process.env.JWT_SECRET = 'test-jwt-secret-key'
process.env.SUPABASE_URL = 'https://test.supabase.co'
process.env.SUPABASE_ANON_KEY = 'test-anon-key'
process.env.SUPABASE_SERVICE_KEY = 'test-service-key'
process.env.OPENAI_API_KEY = 'test-openai-key'

/**
 * Global test timeout
 * 
 * Set a reasonable timeout for async operations.
 * Individual tests can override this if needed.
 */
jest.setTimeout(10000)

/**
 * Clean up after each test
 * 
 * This ensures tests don't leak resources or affect each other.
 */
afterEach(() => {
  jest.clearAllMocks()
})

/**
 * Global test utilities
 * 
 * You can add helper functions here that all tests can access.
 */
;(global as any).testUtils = {
  // Example: Wait for a condition to be true
  waitFor: async (condition: () => boolean, timeout = 5000) => {
    const startTime = Date.now()
    while (!condition()) {
      if (Date.now() - startTime > timeout) {
        throw new Error('Timeout waiting for condition')
      }
      await new Promise(resolve => setTimeout(resolve, 100))
    }
  },
}

