/**
 * Mock Yjs Utilities for Backend Testing
 * 
 * Backend tests also need Yjs mocks for testing real-time collaboration features.
 * Similar to frontend mocks but focused on server-side operations.
 */

import * as Y from 'yjs'

/**
 * Creates a test Yjs document for backend tests
 */
export function createTestYDoc(): Y.Doc {
  return new Y.Doc()
}

/**
 * Creates a Yjs document with shapes for testing persistence
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
 * Serializes a Yjs document to a Uint8Array for storage testing
 * 
 * WHY: The backend stores Yjs documents as binary data in the database.
 * This helper converts a Y.Doc to the format we'll store.
 */
export function serializeYDoc(doc: Y.Doc): Uint8Array {
  return Y.encodeStateAsUpdate(doc)
}

/**
 * Deserializes a Yjs document from binary data
 * 
 * WHY: When loading a document from the database, we need to convert
 * the binary data back into a Y.Doc.
 */
export function deserializeYDoc(data: Uint8Array): Y.Doc {
  const doc = new Y.Doc()
  Y.applyUpdate(doc, data)
  return doc
}

/**
 * Creates sample shape data for testing
 * 
 * WHY: Many tests need example shapes. This generates realistic test data.
 */
export function createSampleShapes() {
  return [
    {
      id: 'shape-1',
      type: 'rect',
      x: 100,
      y: 100,
      width: 200,
      height: 150,
      rotation: 0,
      color: '#FF0000',
    },
    {
      id: 'shape-2',
      type: 'circle',
      x: 400,
      y: 200,
      width: 100,
      height: 100,
      rotation: 0,
      color: '#00FF00',
    },
    {
      id: 'shape-3',
      type: 'text',
      x: 300,
      y: 50,
      width: 150,
      height: 40,
      rotation: 0,
      color: '#000000',
      text: 'Hello World',
      fontSize: 24,
    },
  ]
}

