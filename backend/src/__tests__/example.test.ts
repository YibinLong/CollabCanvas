/**
 * Example Backend Test
 * 
 * This test file verifies that the Jest setup works correctly for backend testing.
 * It demonstrates basic testing patterns for Node.js/TypeScript code.
 * 
 * WHY: Before writing real feature tests, we need to confirm the testing
 * infrastructure is working. This is a "smoke test" for the backend test setup.
 */

describe('Backend Testing Infrastructure', () => {
  /**
   * Test 1: Verify Jest is working
   * 
   * WHY: This confirms Jest can run basic tests in the Node environment.
   */
  test('basic Jest test works', () => {
    expect(1 + 1).toBe(2)
    expect('hello').toBeTruthy()
    expect([1, 2, 3]).toHaveLength(3)
  })

  /**
   * Test 2: Verify TypeScript types work
   * 
   * WHY: ts-jest should compile TypeScript. This confirms it works.
   */
  test('TypeScript works in tests', () => {
    interface User {
      id: string
      email: string
    }
    
    const user: User = {
      id: '123',
      email: 'test@example.com',
    }
    
    expect(user.id).toBe('123')
    expect(user.email).toBe('test@example.com')
  })

  /**
   * Test 3: Verify async/await works
   * 
   * WHY: Backend tests often deal with async operations (database, API calls).
   * This confirms async testing works.
   */
  test('async tests work', async () => {
    const asyncFunction = async () => {
      return new Promise((resolve) => {
        setTimeout(() => resolve('success'), 10)
      })
    }
    
    const result = await asyncFunction()
    expect(result).toBe('success')
  })

  /**
   * Test 4: Verify environment variables work
   * 
   * WHY: Backend tests need access to environment variables.
   * These are set in jest.setup.ts.
   */
  test('environment variables are available', () => {
    expect(process.env.NODE_ENV).toBe('test')
    expect(process.env.JWT_SECRET).toBeDefined()
    expect(process.env.DATABASE_URL).toBeDefined()
  })
})

describe('Test Utilities', () => {
  /**
   * Test 5: Verify mock functions work
   * 
   * WHY: Mocking is essential for testing. This confirms Jest mocks work.
   */
  test('mock functions work', () => {
    const mockFn = jest.fn()
    mockFn('test')
    
    expect(mockFn).toHaveBeenCalled()
    expect(mockFn).toHaveBeenCalledWith('test')
    expect(mockFn).toHaveBeenCalledTimes(1)
  })

  /**
   * Test 6: Verify we can mock modules
   * 
   * WHY: Backend tests often need to mock external dependencies.
   * This confirms Jest module mocking works.
   */
  test('module mocking works', () => {
    // Mock a simple function
    const mockAdd = jest.fn((a: number, b: number) => a + b)
    
    const result = mockAdd(2, 3)
    
    expect(result).toBe(5)
    expect(mockAdd).toHaveBeenCalledWith(2, 3)
  })

  /**
   * Test 7: Verify global test utilities work
   * 
   * WHY: We set up global utilities in jest.setup.ts.
   * This confirms they're accessible in tests.
   */
  test('global test utilities are available', async () => {
    let counter = 0
    const condition = () => counter > 0
    
    // Set counter after a delay
    setTimeout(() => { counter = 1 }, 50)
    
    // Wait for condition to be true
    await (global as any).testUtils.waitFor(condition, 1000)
    
    expect(counter).toBe(1)
  })
})

describe('Error Handling', () => {
  /**
   * Test 8: Verify error testing works
   * 
   * WHY: Many tests need to verify that errors are thrown correctly.
   */
  test('can test for thrown errors', () => {
    const throwError = () => {
      throw new Error('Test error')
    }
    
    expect(throwError).toThrow('Test error')
    expect(throwError).toThrow(Error)
  })

  /**
   * Test 9: Verify async error testing works
   * 
   * WHY: Testing async errors requires special syntax.
   */
  test('can test for async errors', async () => {
    const asyncThrowError = async () => {
      throw new Error('Async error')
    }
    
    await expect(asyncThrowError()).rejects.toThrow('Async error')
  })
})

