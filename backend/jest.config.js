/**
 * Jest Configuration for Backend (Node.js with TypeScript)
 * 
 * This configures Jest to work with TypeScript in a Node.js environment.
 * It uses ts-jest to transform TypeScript files and provides proper module resolution.
 */

module.exports = {
  // Use ts-jest preset for TypeScript support
  // This automatically configures Jest to handle .ts files
  preset: 'ts-jest',
  
  // Test environment - 'node' for backend testing (no DOM)
  testEnvironment: 'node',
  
  // Root directory for tests
  roots: ['<rootDir>/src'],
  
  // Patterns to match test files
  // Looks for files ending in .test.ts or .spec.ts
  testMatch: [
    '**/__tests__/**/*.(test|spec).ts',
    '**/?(*.)+(spec|test).ts'
  ],
  
  // Transform TypeScript files using ts-jest
  transform: {
    '^.+\\.ts$': 'ts-jest',
  },
  
  // Module file extensions
  moduleFileExtensions: ['ts', 'js', 'json'],
  
  // Coverage configuration
  collectCoverageFrom: [
    'src/**/*.ts',
    '!src/**/*.d.ts',
    '!src/**/*.test.ts',
    '!src/**/*.spec.ts',
    '!src/server.ts', // Don't include main server file (hard to test in isolation)
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
  
  // Setup file to run before tests
  setupFilesAfterEnv: ['<rootDir>/jest.setup.ts'],
  
  // Clear mocks between tests automatically
  clearMocks: true,
  
  // Module path aliases - matches tsconfig.json paths
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/src/$1',
  },
  
  // Timeout for tests (in milliseconds)
  // Increased for integration tests that may take longer
  testTimeout: 10000,
}

