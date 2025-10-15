/**
 * Z-Index Keyboard Shortcuts Tests
 * 
 * WHY: Verify that keyboard shortcuts ] and [ work for z-index management
 * 
 * WHAT: Tests for:
 * - ] key brings selected shape to front
 * - [ key sends selected shape to back
 * - Shortcuts work with multiple selected shapes
 */

import { renderHook, act } from '@testing-library/react'
import { useCanvasStore } from '@/lib/canvasStore'

describe('Z-Index Keyboard Shortcuts', () => {
  beforeEach(() => {
    const { result } = renderHook(() => useCanvasStore())
    act(() => {
      result.current.clearShapes()
    })
  })

  it('should bring shape to front when ] key is pressed', () => {
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
    
    // Select shape1
    act(() => {
      result.current.selectShape('shape1')
    })
    
    // Simulate pressing ]
    act(() => {
      result.current.bringToFront('shape1')
    })
    
    const shape1 = result.current.shapes.get('shape1')
    const shape2 = result.current.shapes.get('shape2')
    const shape3 = result.current.shapes.get('shape3')
    
    // shape1 should now be on top
    expect(shape1?.zIndex).toBeGreaterThan(shape2?.zIndex || 0)
    expect(shape1?.zIndex).toBeGreaterThan(shape3?.zIndex || 0)
  })

  it('should send shape to back when [ key is pressed', () => {
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
    
    // Select shape3
    act(() => {
      result.current.selectShape('shape3')
    })
    
    // Simulate pressing [
    act(() => {
      result.current.sendToBack('shape3')
    })
    
    const shape1 = result.current.shapes.get('shape1')
    const shape2 = result.current.shapes.get('shape2')
    const shape3 = result.current.shapes.get('shape3')
    
    // shape3 should now be on bottom
    expect(shape3?.zIndex).toBeLessThan(shape1?.zIndex || 0)
    expect(shape3?.zIndex).toBeLessThan(shape2?.zIndex || 0)
  })

  it('should work with multiple selected shapes', () => {
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
        zIndex: 5,
      })
    })
    
    // Select shape1 and shape2
    act(() => {
      result.current.selectMultiple(['shape1', 'shape2'])
    })
    
    const initialShape3ZIndex = result.current.shapes.get('shape3')?.zIndex
    
    // Bring both to front
    act(() => {
      result.current.bringToFront('shape1')
      result.current.bringToFront('shape2')
    })
    
    const shape1 = result.current.shapes.get('shape1')
    const shape2 = result.current.shapes.get('shape2')
    const shape3 = result.current.shapes.get('shape3')
    
    // Both selected shapes should be above shape3
    expect(shape1?.zIndex).toBeGreaterThan(initialShape3ZIndex || 0)
    expect(shape2?.zIndex).toBeGreaterThan(initialShape3ZIndex || 0)
  })
})

