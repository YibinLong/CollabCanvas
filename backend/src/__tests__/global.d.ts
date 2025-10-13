/**
 * Global type definitions for tests
 * 
 * This file extends the global namespace with custom properties
 * available in all test files.
 */

import { Request } from 'express'

declare global {
  var testUtils: {
    waitFor: (condition: () => boolean, timeout?: number) => Promise<void>
  }
  
  namespace Express {
    interface Request {
      user?: {
        id: string
        email: string
        name: string
        created_at: Date
      }
    }
  }
}

export {}

