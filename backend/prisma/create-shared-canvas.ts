/**
 * Create Shared Canvas Document
 * 
 * WHY: The frontend uses a hardcoded document ID "GLOBAL_CANVAS" for a shared canvas
 * where all users collaborate together. This script creates that document in the database.
 * 
 * RUN THIS ONCE to set up the shared canvas.
 */

import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function createSharedCanvas() {
  try {
    console.log('🚀 Creating shared canvas document...')

    // Get the first user from the database to be the owner
    const firstUser = await prisma.user.findFirst()
    
    if (!firstUser) {
      console.error('❌ No users found in database!')
      console.log('💡 Please sign up at least one user first, then run this script again.')
      process.exit(1)
    }

    console.log(`👤 Using user: ${firstUser.email} as owner`)

    // Check if document already exists
    const existing = await prisma.document.findUnique({
      where: { id: 'GLOBAL_CANVAS' }
    })

    if (existing) {
      console.log('✅ Document "GLOBAL_CANVAS" already exists!')
      console.log(`   Title: ${existing.title}`)
      console.log(`   Owner: ${existing.ownerId}`)
      console.log(`   Has state: ${existing.yjsState ? 'Yes' : 'No'}`)
      return
    }

    // Create the shared canvas document
    const document = await prisma.document.create({
      data: {
        id: 'GLOBAL_CANVAS', // Hardcoded ID to match frontend
        title: 'Global Canvas (All Users)',
        ownerId: firstUser.id,
        yjsState: null, // Will be populated when users start drawing
      }
    })

    console.log('✅ Shared canvas document created successfully!')
    console.log(`   ID: ${document.id}`)
    console.log(`   Title: ${document.title}`)
    console.log(`   Owner: ${document.ownerId}`)
    console.log('')
    console.log('🎨 Now all users will connect to the same canvas!')
    console.log('   Shapes will persist when everyone leaves.')

  } catch (error) {
    console.error('❌ Error creating shared canvas:', error)
    throw error
  } finally {
    await prisma.$disconnect()
  }
}

createSharedCanvas()

