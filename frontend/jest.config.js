/**
 * Jest Configuration for Frontend (Next.js)
 * 
 * This configures Jest to work with Next.js, TypeScript, and React Testing Library.
 * It handles module resolution, transforms JSX/TSX files, and sets up the testing environment.
 */

const nextJest = require('next/jest')

// Create Jest config using Next.js's built-in Jest configuration
// This automatically handles Next.js-specific features like module aliases
const createJestConfig = nextJest({
  // Provide the path to your Next.js app to load next.config.js and .env files in your test environment
  dir: './',
})

// Custom Jest configuration
const customJestConfig = {
  // Setup file to run after Jest is initialized
  // This is where we import testing-library/jest-dom for custom matchers
  setupFilesAfterEnv: ['<rootDir>/jest.setup.js'],
  
  // Test environment - jsdom simulates a browser environment for React components
  testEnvironment: 'jest-environment-jsdom',
  
  // Module path aliases - matches tsconfig.json paths
  // Allows using '@/components/Button' instead of '../../components/Button'
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/$1',
  },
  
  // Patterns to match test files
  // Looks for files ending in .test.ts, .test.tsx, .spec.ts, .spec.tsx
  testMatch: [
    '**/__tests__/**/*.(test|spec).[jt]s?(x)',
    '**/?(*.)+(spec|test).[jt]s?(x)'
  ],
  
  // Coverage configuration
  collectCoverageFrom: [
    'app/**/*.{js,jsx,ts,tsx}',
    'components/**/*.{js,jsx,ts,tsx}',
    'lib/**/*.{js,jsx,ts,tsx}',
    'hooks/**/*.{js,jsx,ts,tsx}',
    '!**/*.d.ts',
    '!**/node_modules/**',
    '!**/.next/**',
  ],
  
  // Coverage thresholds - ensures we maintain good test coverage
  coverageThreshold: {
    global: {
      branches: 70,
      functions: 70,
      lines: 70,
      statements: 70,
    },
  },
}

// Export the configuration by merging custom config with Next.js config
module.exports = createJestConfig(customJestConfig)

