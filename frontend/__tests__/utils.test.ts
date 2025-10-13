/**
 * Test Utilities Test
 * 
 * This file tests the test utilities we created to make sure they work correctly.
 * These utilities will be used in future feature tests.
 * 
 * WHY: If the test utilities are broken, all tests that use them will fail.
 * These tests verify the utilities themselves work correctly.
 */

import {
  createTestYDoc,
  createTestYDocWithShapes,
  createConnectedYDocs,
  MockWebSocketProvider,
} from './utils/mockYjs'
import { mockUser, mockSession, createMockJWT } from './utils/mockAuth'
import { MockWebSocket, MockWebSocketServer } from './utils/mockWebSocket'

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
      { id: 'shape1', type: 'rect', x: 0, y: 0, width: 100, height: 100 },
      { id: 'shape2', type: 'circle', x: 200, y: 200, width: 50, height: 50 },
    ]
    
    const doc = createTestYDocWithShapes(shapes)
    const shapesMap = doc.getMap('shapes')
    
    expect(shapesMap.size).toBe(2)
    
    const shape1 = shapesMap.get('shape1')
    expect(shape1?.get('type')).toBe('rect')
    expect(shape1?.get('x')).toBe(0)
  })

  test('createConnectedYDocs creates syncing documents', () => {
    const [doc1, doc2] = createConnectedYDocs()
    
    // Add data to doc1
    const map1 = doc1.getMap('test')
    map1.set('key', 'value')
    
    // Should sync to doc2
    const map2 = doc2.getMap('test')
    expect(map2.get('key')).toBe('value')
  })

  test('MockWebSocketProvider works', () => {
    const doc = createTestYDoc()
    const provider = new MockWebSocketProvider('ws://test', 'room', doc)
    
    expect(provider.connected).toBe(false)
    
    provider.connect()
    expect(provider.connected).toBe(true)
    
    provider.disconnect()
    expect(provider.connected).toBe(false)
  })
})

describe('Auth Test Utilities', () => {
  test('mockUser has expected structure', () => {
    expect(mockUser).toHaveProperty('id')
    expect(mockUser).toHaveProperty('email')
    expect(mockUser.email).toContain('@')
  })

  test('mockSession has expected structure', () => {
    expect(mockSession).toHaveProperty('access_token')
    expect(mockSession).toHaveProperty('user')
    expect(mockSession.user).toEqual(mockUser)
  })

  test('createMockJWT creates a JWT-like string', () => {
    const jwt = createMockJWT()
    
    // JWT format: header.payload.signature
    expect(jwt).toMatch(/^[A-Za-z0-9+/=]+\.[A-Za-z0-9+/=]+\.[A-Za-z0-9-_]+$/)
  })
})

describe('WebSocket Test Utilities', () => {
  test('MockWebSocket simulates connection', () => {
    const ws = new MockWebSocket('ws://test')
    
    expect(ws.readyState).toBe(WebSocket.CONNECTING)
    
    ws.simulateOpen()
    expect(ws.readyState).toBe(WebSocket.OPEN)
    
    ws.simulateClose()
    expect(ws.readyState).toBe(WebSocket.CLOSED)
  })

  test('MockWebSocket tracks sent messages', () => {
    const ws = new MockWebSocket('ws://test')
    ws.simulateOpen()
    
    ws.send('message 1')
    ws.send('message 2')
    
    expect(ws.sentMessages).toHaveLength(2)
    expect(ws.sentMessages).toContain('message 1')
    expect(ws.sentMessages).toContain('message 2')
  })

  test('MockWebSocket triggers message handler', () => {
    const ws = new MockWebSocket('ws://test')
    const handler = jest.fn()
    ws.onmessage = handler
    
    ws.simulateMessage('test data')
    
    expect(handler).toHaveBeenCalled()
    expect(handler).toHaveBeenCalledWith(
      expect.objectContaining({ data: 'test data' })
    )
  })

  test('MockWebSocketServer manages clients', async () => {
    const server = new MockWebSocketServer()
    
    const client1 = server.createClient()
    const client2 = server.createClient()
    
    // Wait for clients to connect (createClient uses setTimeout)
    await new Promise(resolve => setTimeout(resolve, 10))
    
    expect(server.clients).toHaveLength(2)
    
    server.broadcast('hello')
    
    expect(client1.sentMessages).toContain('hello')
    expect(client2.sentMessages).toContain('hello')
    
    server.closeAll()
    expect(server.clients).toHaveLength(0)
  })
})

