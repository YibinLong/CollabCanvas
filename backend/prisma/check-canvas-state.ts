/**
 * Check Canvas State in Database
 * 
 * WHY: Verify that shapes are being saved to the database
 */

import { PrismaClient } from '@prisma/client'
import * as Y from 'yjs'

const prisma = new PrismaClient()

async function checkCanvasState() {
  try {
    console.log('🔍 Checking canvas state in database...\n')

    const document = await prisma.document.findUnique({
      where: { id: 'GLOBAL_CANVAS' }
    })

    if (!document) {
      console.log('❌ Document "GLOBAL_CANVAS" not found!')
      console.log('💡 Run: npm run create-shared-canvas')
      process.exit(1)
    }

    console.log('✅ Document found:')
    console.log(`   ID: ${document.id}`)
    console.log(`   Title: ${document.title}`)
    console.log(`   Owner ID: ${document.ownerId}`)
    console.log(`   Created: ${document.createdAt}`)
    console.log(`   Updated: ${document.updatedAt}`)
    console.log('')

    if (!document.yjsState || document.yjsState.length === 0) {
      console.log('⚠️  No canvas state saved yet (yjsState is NULL/empty)')
      console.log('💡 This is normal if no one has drawn anything yet.')
      console.log('   Try drawing some shapes, then run this script again.')
    } else {
      console.log(`✅ Canvas state exists: ${document.yjsState.length} bytes`)
      console.log('')
      console.log('📊 Decoding canvas state...')
      
      try {
        // Decode the Yjs state
        const ydoc = new Y.Doc()
        const state = new Uint8Array(document.yjsState)
        Y.applyUpdate(ydoc, state)
        
        const shapesMap = ydoc.getMap('shapes')
        const shapeCount = shapesMap.size
        
        console.log(`   📦 Total shapes: ${shapeCount}`)
        
        if (shapeCount > 0) {
          console.log('   🎨 Shapes in canvas:')
          shapesMap.forEach((shapeData: any, shapeId: string) => {
            console.log(`      - ${shapeData.type} at (${shapeData.x}, ${shapeData.y})`)
          })
        }
      } catch (error) {
        console.error('   ❌ Error decoding state:', error)
      }
    }

  } catch (error) {
    console.error('❌ Error:', error)
    throw error
  } finally {
    await prisma.$disconnect()
  }
}

checkCanvasState()

