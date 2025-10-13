/**
 * Test Database Utilities
 * 
 * Helpers for setting up and tearing down test database state.
 * These ensure each test starts with a clean database.
 * 
 * WHY: Database tests need to be isolated. If one test leaves data behind,
 * it can break other tests. These utilities clean up after each test.
 */

import { PrismaClient } from '@prisma/client'

/**
 * Create a Prisma client for testing
 * 
 * WHY: Tests should use a separate database from development.
 * This creates a client configured for the test environment.
 */
export function createTestPrismaClient(): PrismaClient {
  return new PrismaClient({
    datasources: {
      db: {
        url: process.env.DATABASE_URL,
      },
    },
  })
}

/**
 * Clear all data from test database
 * 
 * WHY: Between tests, we want a clean slate. This deletes all data
 * so the next test starts fresh.
 * 
 * USAGE:
 *   beforeEach(async () => {
 *     await clearDatabase(prisma)
 *   })
 */
export async function clearDatabase(prisma: PrismaClient) {
  // Delete in order to respect foreign key constraints
  await prisma.documentVersion.deleteMany()
  await prisma.document.deleteMany()
  await prisma.user.deleteMany()
}

/**
 * Create test user in database
 * 
 * WHY: Many tests need a user to exist. This helper creates one quickly.
 */
export async function createTestUser(prisma: PrismaClient, data?: {
  id?: string
  email?: string
  name?: string
}) {
  return await prisma.user.create({
    data: {
      id: data?.id || 'test-user-123',
      email: data?.email || 'test@example.com',
      name: data?.name || 'Test User',
    },
  })
}

/**
 * Create test document in database
 * 
 * WHY: Many tests need a document to exist. This helper creates one quickly.
 */
export async function createTestDocument(
  prisma: PrismaClient,
  userId: string,
  data?: {
    id?: string
    title?: string
    yjsState?: Buffer
  }
) {
  return await prisma.document.create({
    data: {
      id: data?.id || 'test-doc-123',
      title: data?.title || 'Test Document',
      ownerId: userId,
      yjsState: data?.yjsState || Buffer.from([]),
    },
  })
}

/**
 * Seed database with test data
 * 
 * WHY: Some integration tests need a realistic database state.
 * This creates a complete set of test data.
 */
export async function seedTestDatabase(prisma: PrismaClient) {
  // Create test user
  const user = await createTestUser(prisma)
  
  // Create test documents
  const doc1 = await createTestDocument(prisma, user.id, {
    id: 'doc-1',
    title: 'First Document',
  })
  
  const doc2 = await createTestDocument(prisma, user.id, {
    id: 'doc-2',
    title: 'Second Document',
  })
  
  // Create document versions
  await prisma.documentVersion.create({
    data: {
      documentId: doc1.id,
      yjsState: Buffer.from([]),
      label: 'Initial version',
    },
  })
  
  return { user, documents: [doc1, doc2] }
}

/**
 * Close Prisma client connection
 * 
 * WHY: After tests complete, we need to close the database connection
 * to prevent hanging processes.
 */
export async function closePrismaClient(prisma: PrismaClient) {
  await prisma.$disconnect()
}

