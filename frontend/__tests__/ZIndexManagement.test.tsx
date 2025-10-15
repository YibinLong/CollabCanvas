/**
 * Z-Index Management Tests
 * 
 * WHY: Tests verify that the z-index ordering system works correctly.
 * This ensures shapes can be properly layered (bring to front, send to back, etc.)
 * 
 * WHAT: Tests for:
 * - Bring to Front: Move shape to highest layer
 * - Send to Back: Move shape to lowest layer
 * - Bring Forward: Move shape up one layer
 * - Send Backward: Move shape down one layer
 */

import { renderHook, act } from '@testing-library/react'
import { useCanvasStore } from '@/lib/canvasStore'
import type { Shape } from '@/types/canvas'

describe('Z-Index Management', () => {
  // Reset store before each test
  beforeEach(() => {
    const { result } = renderHook(() => useCanvasStore())
    act(() => {
      result.current.clearShapes()
    })
  })

  describe('Bring to Front', () => {
    it('should move a shape to the highest z-index', () => {
      const { result } = renderHook(() => useCanvasStore())
      
      // Create three shapes with different z-indices
      act(() => {
        result.current.addShape({
          id: 'shape1',
          type: 'rect',
          x: 100,
          y: 100,
          width: 100,
          height: 100,
          color: '#ff0000',
          zIndex: 0,
        })
        result.current.addShape({
          id: 'shape2',
          type: 'rect',
          x: 120,
          y: 120,
          width: 100,
          height: 100,
          color: '#00ff00',
          zIndex: 1,
        })
        result.current.addShape({
          id: 'shape3',
          type: 'rect',
          x: 140,
          y: 140,
          width: 100,
          height: 100,
          color: '#0000ff',
          zIndex: 2,
        })
      })
      
      // Bring shape1 to front
      act(() => {
        result.current.bringToFront('shape1')
      })
      
      const shape1 = result.current.shapes.get('shape1')
      const shape2 = result.current.shapes.get('shape2')
      const shape3 = result.current.shapes.get('shape3')
      
      // shape1 should now have the highest z-index
      expect(shape1?.zIndex).toBeGreaterThan(shape2?.zIndex || 0)
      expect(shape1?.zIndex).toBeGreaterThan(shape3?.zIndex || 0)
    })
  })

  describe('Send to Back', () => {
    it('should move a shape to the lowest z-index', () => {
      const { result } = renderHook(() => useCanvasStore())
      
      // Create three shapes
      act(() => {
        result.current.addShape({
          id: 'shape1',
          type: 'rect',
          x: 100,
          y: 100,
          width: 100,
          height: 100,
          color: '#ff0000',
          zIndex: 0,
        })
        result.current.addShape({
          id: 'shape2',
          type: 'rect',
          x: 120,
          y: 120,
          width: 100,
          height: 100,
          color: '#00ff00',
          zIndex: 1,
        })
        result.current.addShape({
          id: 'shape3',
          type: 'rect',
          x: 140,
          y: 140,
          width: 100,
          height: 100,
          color: '#0000ff',
          zIndex: 2,
        })
      })
      
      // Send shape3 to back
      act(() => {
        result.current.sendToBack('shape3')
      })
      
      const shape1 = result.current.shapes.get('shape1')
      const shape2 = result.current.shapes.get('shape2')
      const shape3 = result.current.shapes.get('shape3')
      
      // shape3 should now have the lowest z-index
      expect(shape3?.zIndex).toBeLessThan(shape1?.zIndex || 0)
      expect(shape3?.zIndex).toBeLessThan(shape2?.zIndex || 0)
    })
  })

  describe('Bring Forward', () => {
    it('should move a shape up one layer', () => {
      const { result } = renderHook(() => useCanvasStore())
      
      // Create three shapes with consecutive z-indices
      act(() => {
        result.current.addShape({
          id: 'shape1',
          type: 'rect',
          x: 100,
          y: 100,
          width: 100,
          height: 100,
          color: '#ff0000',
          zIndex: 0,
        })
        result.current.addShape({
          id: 'shape2',
          type: 'rect',
          x: 120,
          y: 120,
          width: 100,
          height: 100,
          color: '#00ff00',
          zIndex: 1,
        })
        result.current.addShape({
          id: 'shape3',
          type: 'rect',
          x: 140,
          y: 140,
          width: 100,
          height: 100,
          color: '#0000ff',
          zIndex: 2,
        })
      })
      
      // Bring shape1 forward (should move above shape2)
      act(() => {
        result.current.bringForward('shape1')
      })
      
      const shape1 = result.current.shapes.get('shape1')
      const shape2 = result.current.shapes.get('shape2')
      
      // shape1 should now be above shape2
      expect(shape1?.zIndex).toBeGreaterThan(shape2?.zIndex || 0)
    })

    it('should do nothing if already at the top', () => {
      const { result } = renderHook(() => useCanvasStore())
      
      act(() => {
        result.current.addShape({
          id: 'shape1',
          type: 'rect',
          x: 100,
          y: 100,
          width: 100,
          height: 100,
          color: '#ff0000',
          zIndex: 5,
        })
      })
      
      const initialZIndex = result.current.shapes.get('shape1')?.zIndex
      
      // Try to bring forward when already at top
      act(() => {
        result.current.bringForward('shape1')
      })
      
      const finalZIndex = result.current.shapes.get('shape1')?.zIndex
      
      // Z-index should remain unchanged
      expect(finalZIndex).toBe(initialZIndex)
    })
  })

  describe('Send Backward', () => {
    it('should move a shape down one layer', () => {
      const { result } = renderHook(() => useCanvasStore())
      
      // Create three shapes
      act(() => {
        result.current.addShape({
          id: 'shape1',
          type: 'rect',
          x: 100,
          y: 100,
          width: 100,
          height: 100,
          color: '#ff0000',
          zIndex: 0,
        })
        result.current.addShape({
          id: 'shape2',
          type: 'rect',
          x: 120,
          y: 120,
          width: 100,
          height: 100,
          color: '#00ff00',
          zIndex: 1,
        })
        result.current.addShape({
          id: 'shape3',
          type: 'rect',
          x: 140,
          y: 140,
          width: 100,
          height: 100,
          color: '#0000ff',
          zIndex: 2,
        })
      })
      
      // Send shape3 backward (should move below shape2)
      act(() => {
        result.current.sendBackward('shape3')
      })
      
      const shape2 = result.current.shapes.get('shape2')
      const shape3 = result.current.shapes.get('shape3')
      
      // shape3 should now be below shape2
      expect(shape3?.zIndex).toBeLessThan(shape2?.zIndex || 0)
    })

    it('should do nothing if already at the bottom', () => {
      const { result } = renderHook(() => useCanvasStore())
      
      act(() => {
        result.current.addShape({
          id: 'shape1',
          type: 'rect',
          x: 100,
          y: 100,
          width: 100,
          height: 100,
          color: '#ff0000',
          zIndex: 0,
        })
      })
      
      const initialZIndex = result.current.shapes.get('shape1')?.zIndex
      
      // Try to send backward when already at bottom
      act(() => {
        result.current.sendBackward('shape1')
      })
      
      const finalZIndex = result.current.shapes.get('shape1')?.zIndex
      
      // Z-index should remain unchanged
      expect(finalZIndex).toBe(initialZIndex)
    })
  })

  describe('Rendering Order', () => {
    it('should render shapes in correct z-index order', () => {
      const { result } = renderHook(() => useCanvasStore())
      
      // Create shapes with different z-indices (added in random order)
      act(() => {
        result.current.addShape({
          id: 'shape2',
          type: 'rect',
          x: 100,
          y: 100,
          width: 100,
          height: 100,
          color: '#00ff00',
          zIndex: 5,
        })
        result.current.addShape({
          id: 'shape1',
          type: 'rect',
          x: 120,
          y: 120,
          width: 100,
          height: 100,
          color: '#ff0000',
          zIndex: 2,
        })
        result.current.addShape({
          id: 'shape3',
          type: 'rect',
          x: 140,
          y: 140,
          width: 100,
          height: 100,
          color: '#0000ff',
          zIndex: 10,
        })
      })
      
      // Get shapes as an array sorted by z-index (like Canvas does)
      const sortedShapes = Array.from(result.current.shapes.values())
        .sort((a, b) => (a.zIndex || 0) - (b.zIndex || 0))
      
      // Verify correct order
      expect(sortedShapes[0].id).toBe('shape1') // zIndex: 2
      expect(sortedShapes[1].id).toBe('shape2') // zIndex: 5
      expect(sortedShapes[2].id).toBe('shape3') // zIndex: 10
    })
  })
})

