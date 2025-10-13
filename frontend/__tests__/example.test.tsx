/**
 * Example Frontend Test
 * 
 * This test file verifies that the Jest and React Testing Library setup works correctly.
 * It demonstrates basic testing patterns you'll use throughout the project.
 * 
 * WHY: Before writing real feature tests, we need to confirm the testing
 * infrastructure is working. This is a "smoke test" for the test setup.
 */

import { render, screen } from '@testing-library/react'
import '@testing-library/jest-dom'

/**
 * Simple test component
 * 
 * WHY: We need a React component to test. This is the simplest possible component.
 */
function TestComponent() {
  return (
    <div>
      <h1>Hello Testing</h1>
      <button>Click me</button>
    </div>
  )
}

describe('Testing Infrastructure', () => {
  /**
   * Test 1: Verify Jest is working
   * 
   * WHY: This confirms Jest can run basic JavaScript tests.
   * If this fails, there's a problem with Jest configuration.
   */
  test('basic Jest test works', () => {
    expect(1 + 1).toBe(2)
    expect('hello').toBeTruthy()
    expect([1, 2, 3]).toHaveLength(3)
  })

  /**
   * Test 2: Verify React Testing Library works
   * 
   * WHY: This confirms we can render React components in tests.
   * The 'render' function creates a virtual DOM we can test against.
   */
  test('can render a React component', () => {
    render(<TestComponent />)
    
    // screen.getByText throws an error if the text isn't found
    // This confirms the component rendered successfully
    expect(screen.getByText('Hello Testing')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Click me' })).toBeInTheDocument()
  })

  /**
   * Test 3: Verify jest-dom matchers work
   * 
   * WHY: jest-dom adds useful matchers like toBeInTheDocument().
   * This confirms those matchers are loaded correctly.
   */
  test('jest-dom matchers work', () => {
    render(<TestComponent />)
    
    const heading = screen.getByText('Hello Testing')
    const button = screen.getByRole('button')
    
    // These matchers come from @testing-library/jest-dom
    expect(heading).toBeInTheDocument()
    expect(heading).toBeVisible()
    expect(button).toBeEnabled()
  })

  /**
   * Test 4: Verify async testing works
   * 
   * WHY: Many real tests need to wait for async operations.
   * This confirms async/await works in tests.
   */
  test('async tests work', async () => {
    const asyncFunction = () => Promise.resolve('success')
    
    const result = await asyncFunction()
    expect(result).toBe('success')
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
   * Test 6: Verify timers work
   * 
   * WHY: Some tests need to control time (for debouncing, animations, etc).
   * This confirms we can use fake timers.
   */
  test('fake timers work', () => {
    jest.useFakeTimers()
    
    const callback = jest.fn()
    setTimeout(callback, 1000)
    
    expect(callback).not.toHaveBeenCalled()
    
    jest.advanceTimersByTime(1000)
    expect(callback).toHaveBeenCalled()
    
    jest.useRealTimers()
  })
})

