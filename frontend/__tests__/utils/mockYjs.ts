/**
 * Mock Yjs Utilities for Testing
 * 
 * These utilities help test components that use Yjs for real-time collaboration
 * without needing an actual WebSocket connection or server.
 * 
 * WHY: Yjs documents are complex objects. These mocks let us test the logic
 * around Yjs without dealing with the real implementation's complexity.
 */

import * as Y from 'yjs'

/**
 * Creates a test Yjs document
 * 
 * WHY: Many components need a Yjs document. This factory function creates
 * a fresh document for each test, ensuring tests don't interfere with each other.
 * 
 * @returns A new Y.Doc instance ready for testing
 */
export function createTestYDoc(): Y.Doc {
  return new Y.Doc()
}

/**
 * Creates a mock Yjs document with pre-filled shapes
 * 
 * WHY: Some tests need to start with data already in the document.
 * This helper creates a document with sample shapes so you don't have to
 * set up the same data in every test.
 * 
 * @param shapes - Array of shape objects to add to the document
 * @returns A Y.Doc with shapes pre-loaded
 */
export function createTestYDocWithShapes(shapes: any[]): Y.Doc {
  const doc = new Y.Doc()
  const shapesMap = doc.getMap('shapes')
  
  shapes.forEach((shape) => {
    const shapeMap = new Y.Map()
    Object.entries(shape).forEach(([key, value]) => {
      shapeMap.set(key, value)
    })
    shapesMap.set(shape.id, shapeMap)
  })
  
  return doc
}

/**
 * Mock WebSocket Provider
 * 
 * WHY: The WebSocket provider connects to a server. In tests, we don't want
 * real network calls. This mock provider pretends to connect but does nothing.
 * 
 * USAGE:
 *   const provider = new MockWebSocketProvider('ws://test', 'room', doc)
 *   expect(provider.connected).toBe(false)
 *   provider.connect()
 *   expect(provider.connected).toBe(true)
 */
export class MockWebSocketProvider {
  public connected: boolean = false
  public roomName: string
  public doc: Y.Doc
  
  constructor(
    public url: string,
    roomName: string,
    doc: Y.Doc
  ) {
    this.roomName = roomName
    this.doc = doc
  }
  
  connect() {
    this.connected = true
  }
  
  disconnect() {
    this.connected = false
  }
  
  destroy() {
    this.connected = false
  }
  
  // Simulate receiving an update from the server
  simulateUpdate(update: Uint8Array) {
    Y.applyUpdate(this.doc, update)
  }
}

/**
 * Creates two connected Yjs documents for testing sync
 * 
 * WHY: Real-time collaboration means changes in one document appear in another.
 * This helper creates two documents that sync with each other, so you can
 * test that collaboration features work correctly.
 * 
 * @returns Two Y.Doc instances that sync changes between each other
 */
export function createConnectedYDocs(): [Y.Doc, Y.Doc] {
  const doc1 = new Y.Doc()
  const doc2 = new Y.Doc()
  
  // When doc1 changes, apply update to doc2
  doc1.on('update', (update: Uint8Array) => {
    Y.applyUpdate(doc2, update)
  })
  
  // When doc2 changes, apply update to doc1
  doc2.on('update', (update: Uint8Array) => {
    Y.applyUpdate(doc1, update)
  })
  
  return [doc1, doc2]
}

/**
 * Helper to wait for Yjs changes to propagate
 * 
 * WHY: Yjs updates can be asynchronous. This helper waits for all pending
 * updates to complete before continuing the test.
 * 
 * USAGE:
 *   shapesMap.set('shape1', shapeData)
 *   await waitForYjsUpdate(doc)
 *   // Now the update has propagated
 */
export function waitForYjsUpdate(doc: Y.Doc, timeout = 1000): Promise<void> {
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => {
      reject(new Error('Timeout waiting for Yjs update'))
    }, timeout)
    
    // Wait for the next update event
    doc.once('update', () => {
      clearTimeout(timer)
      // Use setTimeout to let all synchronous processing complete
      setTimeout(resolve, 0)
    })
  })
}

