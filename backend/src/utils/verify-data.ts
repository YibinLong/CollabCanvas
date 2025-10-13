/**
 * Data Verification Script
 * 
 * Shows detailed information about what's in the database
 */

import { prisma } from './prisma';

async function verifyData() {
  console.log('📊 DATABASE VERIFICATION\n');

  try {
    // Get all users
    const users = await prisma.user.findMany({
      include: {
        documents: true, // Include their documents
      },
    });

    console.log('👥 USERS:');
    users.forEach(user => {
      console.log(`   • ${user.name} (${user.email})`);
      console.log(`     - ID: ${user.id}`);
      console.log(`     - Documents owned: ${user.documents.length}`);
    });

    console.log('\n📄 DOCUMENTS:');
    const documents = await prisma.document.findMany({
      include: {
        owner: true,
      },
    });

    documents.forEach(doc => {
      console.log(`   • "${doc.title}"`);
      console.log(`     - ID: ${doc.id}`);
      console.log(`     - Owner: ${doc.owner.name}`);
      console.log(`     - Created: ${doc.createdAt.toLocaleDateString()}`);
    });

    console.log('\n✅ Database verification complete!\n');

  } catch (error) {
    console.error('❌ Verification failed:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

verifyData();

