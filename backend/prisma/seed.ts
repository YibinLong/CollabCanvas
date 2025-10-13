/**
 * Prisma Seed File
 * 
 * This file populates the database with sample data for testing.
 * Run with: npm run seed (after we add the script)
 * 
 * WHY: Having test data makes it easy to develop and test features
 * without manually creating data every time.
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting database seed...');

  // Create test users
  console.log('Creating test users...');
  
  const alice = await prisma.user.upsert({
    where: { email: 'alice@example.com' },
    update: {},
    create: {
      email: 'alice@example.com',
      name: 'Alice Designer',
      avatarUrl: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Alice',
    },
  });

  const bob = await prisma.user.upsert({
    where: { email: 'bob@example.com' },
    update: {},
    create: {
      email: 'bob@example.com',
      name: 'Bob Developer',
      avatarUrl: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Bob',
    },
  });

  console.log(`✅ Created users: ${alice.name}, ${bob.name}`);

  // Create test documents
  console.log('Creating test documents...');

  const doc1 = await prisma.document.create({
    data: {
      title: 'My First Canvas',
      ownerId: alice.id,
      // Empty Yjs state for now (will be populated when users interact)
      yjsState: null,
    },
  });

  const doc2 = await prisma.document.create({
    data: {
      title: 'Design Mockup',
      ownerId: bob.id,
      yjsState: null,
    },
  });

  const doc3 = await prisma.document.create({
    data: {
      title: 'Untitled',
      ownerId: alice.id,
      yjsState: null,
    },
  });

  console.log(`✅ Created ${3} documents`);
  console.log(`   - ${doc1.title} (owned by ${alice.name})`);
  console.log(`   - ${doc2.title} (owned by ${bob.name})`);
  console.log(`   - ${doc3.title} (owned by ${alice.name})`);

  console.log('\n✨ Seed completed successfully!');
}

main()
  .catch((e) => {
    console.error('❌ Seed failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

