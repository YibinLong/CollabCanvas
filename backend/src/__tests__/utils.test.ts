/**
 * Backend Test Utilities Test
 * 
 * This file tests the backend test utilities we created.
 * These utilities will be used in future API and integration tests.
 * 
 * WHY: If the test utilities are broken, all tests that use them will fail.
 * These tests verify the utilities themselves work correctly.
 */

import {
  createTestYDoc,
  createTestYDocWithShapes,
  serializeYDoc,
  deserializeYDoc,
  createSampleShapes,
} from './utils/mockYjs'
import {
  mockUser,
  mockAuthenticatedRequest,
  createExpressMocks,
} from './utils/mockAuth'
import {
  MockWebSocketConnection,
  MockWebSocketServer,
  createYjsSyncTest,
} from './utils/mockWebSocket'

describe('Yjs Test Utilities', () => {
  test('createTestYDoc creates a valid Yjs document', () => {
    const doc = createTestYDoc()
    
    expect(doc).toBeDefined()
    
    // Can add data to the document
    const map = doc.getMap('test')
    map.set('key', 'value')
    expect(map.get('key')).toBe('value')
  })

  test('createTestYDocWithShapes creates doc with shapes', () => {
    const shapes = [
      { id: 'shape1', type: 'rect', x: 0, y: 0 },
      { id: 'shape2', type: 'circle', x: 100, y: 100 },
    ]
    
    const doc = createTestYDocWithShapes(shapes)
    const shapesMap = doc.getMap('shapes')
    
    expect(shapesMap.size).toBe(2)
    
    const shape1 = shapesMap.get('shape1') as any
    expect(shape1?.get('type')).toBe('rect')
  })

  test('serializeYDoc and deserializeYDoc work', () => {
    const doc1 = createTestYDoc()
    doc1.getMap('test').set('key', 'value')
    
    // Serialize to bytes
    const bytes = serializeYDoc(doc1)
    expect(bytes).toBeInstanceOf(Uint8Array)
    expect(bytes.length).toBeGreaterThan(0)
    
    // Deserialize to new doc
    const doc2 = deserializeYDoc(bytes)
    expect(doc2.getMap('test').get('key')).toBe('value')
  })

  test('createSampleShapes returns valid shape data', () => {
    const shapes = createSampleShapes()
    
    expect(shapes).toBeInstanceOf(Array)
    expect(shapes.length).toBeGreaterThan(0)
    
    shapes.forEach(shape => {
      expect(shape).toHaveProperty('id')
      expect(shape).toHaveProperty('type')
      expect(shape).toHaveProperty('x')
      expect(shape).toHaveProperty('y')
    })
  })
})

describe('Auth Test Utilities', () => {
  test('mockUser has expected structure', () => {
    expect(mockUser).toHaveProperty('id')
    expect(mockUser).toHaveProperty('email')
    expect(mockUser).toHaveProperty('name')
  })

  test('mockAuthenticatedRequest creates request with user', () => {
    const req = mockAuthenticatedRequest()
    
    expect(req.user).toBeDefined()
    expect(req.user).toEqual(mockUser)
    expect(req.headers?.authorization).toContain('Bearer')
  })

  test('createExpressMocks creates mock req/res/next', () => {
    const { req, res, next } = createExpressMocks()
    
    expect(req).toBeDefined()
    expect(res).toBeDefined()
    expect(next).toBeDefined()
    
    // Res should have chainable methods
    res.status(200).json({ success: true })
    
    expect(res.status).toHaveBeenCalledWith(200)
    expect(res.json).toHaveBeenCalledWith({ success: true })
  })
})

describe('WebSocket Test Utilities', () => {
  test('MockWebSocketConnection simulates client connection', () => {
    const client = new MockWebSocketConnection()
    
    expect(client.readyState).toBe(1) // OPEN
    
    client.send('test message')
    expect(client.sentMessages).toContain('test message')
    
    client.simulateClose()
    expect(client.readyState).toBe(3) // CLOSED
  })

  test('MockWebSocketConnection emits events', () => {
    const client = new MockWebSocketConnection()
    const messageHandler = jest.fn()
    const closeHandler = jest.fn()
    
    client.on('message', messageHandler)
    client.on('close', closeHandler)
    
    client.simulateMessage('hello')
    expect(messageHandler).toHaveBeenCalledWith('hello')
    
    client.simulateClose()
    expect(closeHandler).toHaveBeenCalled()
  })

  test('MockWebSocketServer manages clients', () => {
    const server = new MockWebSocketServer()
    server.start()
    
    expect(server.isRunning).toBe(true)
    
    const client1 = server.createClient()
    const client2 = server.createClient()
    
    expect(server.clientCount).toBe(2)
    
    server.broadcast('hello')
    expect(client1.sentMessages).toContain('hello')
    expect(client2.sentMessages).toContain('hello')
    
    server.stop()
    expect(server.isRunning).toBe(false)
    expect(server.clientCount).toBe(0)
  })

  test('createYjsSyncTest creates sync test environment', () => {
    const { server, client1, client2, doc1, doc2 } = createYjsSyncTest()
    
    expect(server).toBeDefined()
    expect(client1).toBeDefined()
    expect(client2).toBeDefined()
    expect(doc1).toBeDefined()
    expect(doc2).toBeDefined()
    
    expect(server.clientCount).toBe(2)
  })
})

describe('Error Scenarios', () => {
  test('MockWebSocketConnection handles errors', () => {
    const client = new MockWebSocketConnection()
    const errorHandler = jest.fn()
    
    client.on('error', errorHandler)
    
    const error = new Error('Test error')
    client.simulateError(error)
    
    expect(errorHandler).toHaveBeenCalledWith(error)
  })

  test('sending on closed WebSocket throws error', () => {
    const client = new MockWebSocketConnection()
    client.readyState = 3 // CLOSED
    
    expect(() => {
      client.send('test')
    }).toThrow()
  })
})

