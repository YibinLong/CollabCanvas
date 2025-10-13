/**
 * Jest Setup File
 * 
 * This file runs once before all tests. It imports custom matchers from
 * @testing-library/jest-dom, which add useful assertions like:
 * - expect(element).toBeInTheDocument()
 * - expect(element).toHaveTextContent('text')
 * - expect(element).toBeVisible()
 */

import '@testing-library/jest-dom'

/**
 * Mock window.matchMedia
 * 
 * Many UI libraries check for media queries. Since jsdom doesn't implement
 * matchMedia, we need to mock it to prevent test errors.
 */
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: jest.fn().mockImplementation(query => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: jest.fn(), // deprecated
    removeListener: jest.fn(), // deprecated
    addEventListener: jest.fn(),
    removeEventListener: jest.fn(),
    dispatchEvent: jest.fn(),
  })),
})

/**
 * Suppress console errors during tests (optional)
 * 
 * Uncomment if you want to hide expected errors in test output.
 * Use sparingly - you usually want to see errors during testing!
 */
// const originalError = console.error
// beforeAll(() => {
//   console.error = (...args) => {
//     if (typeof args[0] === 'string' && args[0].includes('Warning:')) {
//       return
//     }
//     originalError.call(console, ...args)
//   }
// })
// 
// afterAll(() => {
//   console.error = originalError
// })

