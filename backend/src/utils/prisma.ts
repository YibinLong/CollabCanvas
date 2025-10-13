/**
 * Prisma Client Singleton
 * 
 * WHY: Creating a single Prisma Client instance and reusing it across
 * the application is more efficient than creating multiple instances.
 * 
 * This prevents connection issues and improves performance.
 * 
 * SUPABASE NOTE: We use DIRECT_URL to avoid connection pooling issues
 * with prepared statements in test scripts.
 */

import { PrismaClient } from '@prisma/client';

// Global variable to store the Prisma client (prevents multiple instances)
declare global {
  // eslint-disable-next-line no-var
  var prisma: PrismaClient | undefined;
}

// Create or reuse Prisma client
// In development, this prevents creating new instances on hot reload
export const prisma = global.prisma || new PrismaClient({
  log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
  // Use DIRECT_URL for better Supabase compatibility
  datasources: {
    db: {
      url: process.env.DIRECT_URL || process.env.DATABASE_URL,
    },
  },
});

// Store in global variable in development
if (process.env.NODE_ENV !== 'production') {
  global.prisma = prisma;
}

// Export a function to disconnect (useful for testing and cleanup)
export async function disconnectPrisma() {
  await prisma.$disconnect();
}

