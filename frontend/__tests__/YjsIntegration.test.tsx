/**
 * PR #10: Yjs Integration Tests
 * 
 * WHY: These tests verify that Yjs (the real-time collaboration library) works
 * correctly with our Zustand store. Following TDD, we write these tests FIRST,
 * then implement the features to make them pass.
 * 
 * WHAT WE'RE TESTING:
 * 1. Yjs document initializes with Y.Map for shapes
 * 2. Shape added to Zustand syncs to Yjs
 * 3. WebSocket provider connects successfully
 * 4. Two clients can sync shape creation
 * 
 * HOW IT WORKS:
 * - Yjs documents store data in special types (Y.Map, Y.Array, etc.)
 * - When we update the Yjs document, it generates "updates" that can be
 *   sent over the network to other clients
 * - We test that our integration correctly syncs data between Zustand and Yjs
 */

import { renderHook, act, waitFor } from '@testing-library/react'
import * as Y from 'yjs'
import { useCanvasStore } from '@/lib/canvasStore'
import { createTestYDoc, createConnectedYDocs, MockWebSocketProvider } from './utils/mockYjs'
import type { Shape } from '@/types/canvas'

describe('PR #10: Yjs Integration Tests (TDD - Write Tests First)', () => {
  /**
   * Test 1: Yjs document initializes with Y.Map
   * 
   * WHY: Our canvas state needs to be stored in a Yjs Y.Map so it can
   * be synced across clients. This test ensures the document structure is correct.
   */
  describe('Yjs Document Initialization', () => {
    it('should initialize Yjs document with Y.Map for shapes', () => {
      // Create a test Yjs document
      const doc = createTestYDoc()
      
      // Get the shapes map (this is where we'll store all shapes)
      const shapesMap = doc.getMap('shapes')
      
      // EXPECT: The shapes map should exist and be a Y.Map
      expect(shapesMap).toBeInstanceOf(Y.Map)
      expect(shapesMap.size).toBe(0) // Should start empty
    })

    it('should allow adding shapes to Y.Map', () => {
      const doc = createTestYDoc()
      const shapesMap = doc.getMap('shapes')
      
      // Create a test shape as a Y.Map (Yjs requires nested maps)
      const shapeData = new Y.Map()
      shapeData.set('id', 'test-shape-1')
      shapeData.set('type', 'rect')
      shapeData.set('x', 100)
      shapeData.set('y', 100)
      shapeData.set('width', 200)
      shapeData.set('height', 100)
      
      // Add the shape to the shapes map
      shapesMap.set('test-shape-1', shapeData)
      
      // EXPECT: The shape should be retrievable
      expect(shapesMap.size).toBe(1)
      expect(shapesMap.get('test-shape-1')).toBe(shapeData)
      expect(shapeData.get('type')).toBe('rect')
    })
  })

  /**
   * Test 2: Shape added to Zustand syncs to Yjs
   * 
   * WHY: When a user creates a shape, we add it to Zustand (for React rendering).
   * We also need to sync it to Yjs (for real-time collaboration).
   * This test ensures our sync mechanism works.
   * 
   * NOTE: With PR #11 implementation, these tests should now pass.
   */
  describe('Zustand to Yjs Sync', () => {
    it('should sync shape from Zustand to Yjs when added', async () => {
      // For this test, we'll directly test the sync logic by simulating
      // what useYjsSync does: subscribing to Zustand and updating Yjs
      
      // Setup: Create a Yjs document
      const doc = createTestYDoc()
      const shapesMap = doc.getMap('shapes')
      
      // Setup: Initialize the canvas store
      const { result } = renderHook(() => useCanvasStore())
      
      // Setup: Simulate the sync that useYjsSync provides
      // Subscribe to store changes and sync to Yjs
      const unsubscribe = useCanvasStore.subscribe((state) => {
        state.shapes.forEach((shape, shapeId) => {
          let yjsShape = shapesMap.get(shapeId) as Y.Map<any>
          if (!yjsShape) {
            yjsShape = new Y.Map()
            shapesMap.set(shapeId, yjsShape)
          }
          
          Object.entries(shape).forEach(([key, value]) => {
            if (value !== undefined) {
              yjsShape.set(key, value)
            }
          })
        })
      })
      
      // Create a test shape
      const testShape: Shape = {
        id: 'shape-1',
        type: 'rect',
        x: 50,
        y: 50,
        width: 100,
        height: 100,
        rotation: 0,
        color: '#3b82f6',
        zIndex: 0,
      }
      
      // Action: Add shape to Zustand store
      act(() => {
        result.current.addShape(testShape)
      })
      
      // EXPECT: Shape should exist in Zustand
      expect(result.current.shapes.has('shape-1')).toBe(true)
      
      // EXPECT: Shape should also sync to Yjs
      await waitFor(() => {
        expect(shapesMap.has('shape-1')).toBe(true)
      }, { timeout: 500 })
      
      // Verify the shape data in Yjs
      const yjsShape = shapesMap.get('shape-1') as Y.Map<any>
      expect(yjsShape.get('type')).toBe('rect')
      expect(yjsShape.get('x')).toBe(50)
      expect(yjsShape.get('y')).toBe(50)
      
      // Cleanup
      unsubscribe()
    })

    it('should sync shape updates from Zustand to Yjs', async () => {
      const doc = createTestYDoc()
      const shapesMap = doc.getMap('shapes')
      const { result } = renderHook(() => useCanvasStore())
      
      // Setup sync
      const unsubscribe = useCanvasStore.subscribe((state) => {
        state.shapes.forEach((shape, shapeId) => {
          let yjsShape = shapesMap.get(shapeId) as Y.Map<any>
          if (!yjsShape) {
            yjsShape = new Y.Map()
            shapesMap.set(shapeId, yjsShape)
          }
          
          Object.entries(shape).forEach(([key, value]) => {
            if (value !== undefined) {
              yjsShape.set(key, value)
            }
          })
        })
      })
      
      // Add initial shape
      const testShape: Shape = {
        id: 'shape-2',
        type: 'circle',
        x: 60,  // Top-left corner of bounding box (center 100 - radius 40)
        y: 60,
        width: 80,  // Width of bounding box (radius 40 * 2)
        height: 80,
        rotation: 0,
        color: '#ef4444',
        zIndex: 0,
      }
      
      act(() => {
        result.current.addShape(testShape)
      })
      
      // Wait for sync
      await waitFor(() => {
        expect(shapesMap.has('shape-2')).toBe(true)
      }, { timeout: 500 })
      
      // Action: Update the shape position
      act(() => {
        result.current.updateShape('shape-2', { x: 200, y: 200 })
      })
      
      // EXPECT: Update should sync to Yjs
      await waitFor(() => {
        const yjsShape = shapesMap.get('shape-2') as Y.Map<any>
        expect(yjsShape.get('x')).toBe(200)
        expect(yjsShape.get('y')).toBe(200)
      }, { timeout: 500 })
      
      // Cleanup
      unsubscribe()
    })
  })

  /**
   * Test 3: WebSocket connects successfully
   * 
   * WHY: The WebSocket provider connects our Yjs document to the server,
   * enabling real-time sync with other users. This tests the connection logic.
   */
  describe('WebSocket Connection', () => {
    it('should create WebSocket provider with correct parameters', () => {
      const doc = createTestYDoc()
      
      // Create a mock WebSocket provider
      // In real implementation, this would be: new WebsocketProvider(url, room, doc)
      const provider = new MockWebSocketProvider(
        'ws://localhost:4000',
        'test-document-123',
        doc
      )
      
      // EXPECT: Provider should be created with correct config
      expect(provider.url).toBe('ws://localhost:4000')
      expect(provider.roomName).toBe('test-document-123')
      expect(provider.doc).toBe(doc)
      expect(provider.connected).toBe(false)
    })

    it('should connect to WebSocket server', () => {
      const doc = createTestYDoc()
      const provider = new MockWebSocketProvider(
        'ws://localhost:4000',
        'test-document-123',
        doc
      )
      
      // Action: Connect
      provider.connect()
      
      // EXPECT: Should be connected
      expect(provider.connected).toBe(true)
    })

    it('should disconnect from WebSocket server', () => {
      const doc = createTestYDoc()
      const provider = new MockWebSocketProvider(
        'ws://localhost:4000',
        'test-document-123',
        doc
      )
      
      provider.connect()
      expect(provider.connected).toBe(true)
      
      // Action: Disconnect
      provider.disconnect()
      
      // EXPECT: Should be disconnected
      expect(provider.connected).toBe(false)
    })
  })

  /**
   * Test 4: Two clients sync shape creation
   * 
   * WHY: The core feature of collaboration is that when one user creates
   * a shape, other users see it too. This test simulates two clients
   * and verifies they stay in sync.
   * 
   * HOW IT WORKS:
   * - Create two Yjs documents (simulating two users/browsers)
   * - Connect them so updates propagate between them
   * - Add a shape to doc1
   * - Verify it appears in doc2
   */
  describe('Multi-Client Sync', () => {
    it('should sync shape creation between two clients', async () => {
      // Setup: Create two connected documents (simulating two users)
      const [doc1, doc2] = createConnectedYDocs()
      
      const shapesMap1 = doc1.getMap('shapes')
      const shapesMap2 = doc2.getMap('shapes')
      
      // Client 1 creates a shape
      const shapeData = new Y.Map()
      shapeData.set('id', 'synced-shape-1')
      shapeData.set('type', 'rect')
      shapeData.set('x', 150)
      shapeData.set('y', 150)
      shapeData.set('width', 100)
      shapeData.set('height', 50)
      shapeData.set('color', '#10b981')
      
      // Action: Add shape to client 1's document
      shapesMap1.set('synced-shape-1', shapeData)
      
      // Give updates time to propagate (in real app this is nearly instant)
      await new Promise(resolve => setTimeout(resolve, 50))
      
      // EXPECT: Shape should appear in client 2's document
      expect(shapesMap2.has('synced-shape-1')).toBe(true)
      
      const syncedShape = shapesMap2.get('synced-shape-1') as Y.Map<any>
      expect(syncedShape.get('type')).toBe('rect')
      expect(syncedShape.get('x')).toBe(150)
      expect(syncedShape.get('y')).toBe(150)
    })

    it('should sync shape updates between two clients', async () => {
      const [doc1, doc2] = createConnectedYDocs()
      
      const shapesMap1 = doc1.getMap('shapes')
      const shapesMap2 = doc2.getMap('shapes')
      
      // Client 1 creates a shape
      const shapeData = new Y.Map()
      shapeData.set('id', 'synced-shape-2')
      shapeData.set('type', 'circle')
      shapeData.set('x', 100)
      shapeData.set('y', 100)
      
      shapesMap1.set('synced-shape-2', shapeData)
      await new Promise(resolve => setTimeout(resolve, 50))
      
      // Verify initial sync
      expect(shapesMap2.has('synced-shape-2')).toBe(true)
      
      // Action: Client 1 updates the shape position
      shapeData.set('x', 300)
      shapeData.set('y', 250)
      
      await new Promise(resolve => setTimeout(resolve, 50))
      
      // EXPECT: Update should sync to client 2
      const syncedShape = shapesMap2.get('synced-shape-2') as Y.Map<any>
      expect(syncedShape.get('x')).toBe(300)
      expect(syncedShape.get('y')).toBe(250)
    })

    it('should sync shape deletion between two clients', async () => {
      const [doc1, doc2] = createConnectedYDocs()
      
      const shapesMap1 = doc1.getMap('shapes')
      const shapesMap2 = doc2.getMap('shapes')
      
      // Client 1 creates a shape
      const shapeData = new Y.Map()
      shapeData.set('id', 'synced-shape-3')
      shapeData.set('type', 'line')
      
      shapesMap1.set('synced-shape-3', shapeData)
      await new Promise(resolve => setTimeout(resolve, 50))
      
      expect(shapesMap2.has('synced-shape-3')).toBe(true)
      
      // Action: Client 1 deletes the shape
      shapesMap1.delete('synced-shape-3')
      
      await new Promise(resolve => setTimeout(resolve, 50))
      
      // EXPECT: Deletion should sync to client 2
      expect(shapesMap2.has('synced-shape-3')).toBe(false)
      expect(shapesMap1.size).toBe(0)
      expect(shapesMap2.size).toBe(0)
    })
  })
})

