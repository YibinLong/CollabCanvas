/**
 * Database Connection Test Script
 * 
 * WHY: This script tests if Prisma can successfully connect to your
 * Supabase database. Run this to verify your .env setup is correct.
 * 
 * Run with: npm run test:db
 */

import { prisma } from './prisma';

async function testConnection() {
  console.log('🔍 Testing database connection...\n');

  try {
    // Test 1: Can we connect to the database?
    console.log('Test 1: Connecting to database...');
    await prisma.$connect();
    console.log('✅ Connected successfully!\n');

    // Test 2: Can we query the database?
    console.log('Test 2: Running test query...');
    const userCount = await prisma.user.count();
    const documentCount = await prisma.document.count();
    console.log('✅ Query successful!');
    console.log(`   - Users in database: ${userCount}`);
    console.log(`   - Documents in database: ${documentCount}\n`);

    // Test 3: Show database info
    console.log('Test 3: Database info...');
    const result = await prisma.$queryRaw`SELECT version()` as any[];
    console.log('✅ Database version:', result[0].version.split(' ')[0]);

    console.log('\n🎉 All tests passed! Database connection is working.\n');
    
  } catch (error) {
    console.error('❌ Database connection failed!');
    console.error('Error details:', error);
    console.error('\n📝 Troubleshooting:');
    console.error('   1. Check your .env file exists in the backend folder');
    console.error('   2. Verify DATABASE_URL is correct (check password)');
    console.error('   3. Make sure you ran: npm run prisma:migrate');
    console.error('   4. Check your Supabase project is active\n');
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

testConnection();

