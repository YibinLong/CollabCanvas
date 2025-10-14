/**
 * PR #8: Canvas Tests - Advanced Selection & Layers
 * 
 * WHY: These tests define advanced selection features that professional
 * design tools have: multi-select, delete shortcuts, and layer ordering.
 * 
 * WHAT: We're testing:
 * 1. Select multiple shapes (Shift+click or drag box)
 * 2. Delete key removes selected shapes
 * 3. Bring shape to front / send to back (layer reordering)
 * 
 * These tests will FAIL initially - that's TDD! We'll make them pass in PR #9.
 */

import { render, screen, fireEvent } from '@testing-library/react'
import '@testing-library/jest-dom'
import { act } from 'react'

import Canvas from '@/components/Canvas'
import { useCanvasStore } from '@/lib/canvasStore'

describe('PR #8: Multi-Selection', () => {
  beforeEach(() => {
    act(() => {
      useCanvasStore.getState().clearShapes()
      useCanvasStore.getState().clearSelection()
      useCanvasStore.getState().setCurrentTool('select')
    })
  })
  
  /**
   * Test 1: Shift+click adds to selection
   * 
   * WHY: Users need to select multiple shapes for batch operations.
   * Standard behavior: Shift+click adds/removes from selection.
   * 
   * WHAT: Select one shape, Shift+click another, verify both are selected.
   */
  test('Shift+click adds shape to selection', () => {
    render(<Canvas />)
    
    // Add two rectangles
    act(() => {
      useCanvasStore.getState().addShape({
        id: 'rect-1',
        type: 'rect',
        x: 100,
        y: 100,
        width: 50,
        height: 50,
        rotation: 0,
      })
      useCanvasStore.getState().addShape({
        id: 'rect-2',
        type: 'rect',
        x: 200,
        y: 200,
        width: 50,
        height: 50,
        rotation: 0,
      })
    })
    
    // Click first shape to select it
    const rect1 = document.querySelector('rect[data-shape-id="rect-1"]')!
    fireEvent.click(rect1)
    
    expect(useCanvasStore.getState().selectedIds).toEqual(['rect-1'])
    
    // Shift+click second shape to add to selection
    const rect2 = document.querySelector('rect[data-shape-id="rect-2"]')!
    fireEvent.click(rect2, { shiftKey: true })
    
    // Both should be selected
    const selectedIds = useCanvasStore.getState().selectedIds
    expect(selectedIds).toContain('rect-1')
    expect(selectedIds).toContain('rect-2')
    expect(selectedIds.length).toBe(2)
  })
  
  /**
   * Test 2: Shift+click on selected shape deselects it
   * 
   * WHY: Users should be able to remove shapes from multi-selection.
   * Shift+clicking an already-selected shape should deselect it.
   */
  test('Shift+click on selected shape removes it from selection', () => {
    render(<Canvas />)
    
    // Add and select two shapes
    act(() => {
      useCanvasStore.getState().addShape({
        id: 'rect-3',
        type: 'rect',
        x: 100,
        y: 100,
        width: 50,
        height: 50,
        rotation: 0,
      })
      useCanvasStore.getState().addShape({
        id: 'rect-4',
        type: 'rect',
        x: 200,
        y: 200,
        width: 50,
        height: 50,
        rotation: 0,
      })
      useCanvasStore.getState().selectMultiple(['rect-3', 'rect-4'])
    })
    
    expect(useCanvasStore.getState().selectedIds.length).toBe(2)
    
    // Shift+click one of them to deselect
    const rect3 = document.querySelector('rect[data-shape-id="rect-3"]')!
    fireEvent.click(rect3, { shiftKey: true })
    
    // Only rect-4 should remain selected
    const selectedIds = useCanvasStore.getState().selectedIds
    expect(selectedIds).toEqual(['rect-4'])
  })
  
  /**
   * Test 3: Multiple selected shapes all show selection indicators
   * 
   * WHY: Visual feedback is important - all selected shapes should
   * show they're selected.
   */
  test('Multiple selected shapes all show selection indicators', () => {
    render(<Canvas />)
    
    // Add and select three shapes
    act(() => {
      useCanvasStore.getState().addShape({
        id: 'rect-5',
        type: 'rect',
        x: 100,
        y: 100,
        width: 50,
        height: 50,
        rotation: 0,
      })
      useCanvasStore.getState().addShape({
        id: 'rect-6',
        type: 'rect',
        x: 200,
        y: 200,
        width: 50,
        height: 50,
        rotation: 0,
      })
      useCanvasStore.getState().addShape({
        id: 'rect-7',
        type: 'rect',
        x: 300,
        y: 300,
        width: 50,
        height: 50,
        rotation: 0,
      })
      useCanvasStore.getState().selectMultiple(['rect-5', 'rect-6', 'rect-7'])
    })
    
    // All three should have selection stroke
    const rect5 = document.querySelector('rect[data-shape-id="rect-5"]')!
    const rect6 = document.querySelector('rect[data-shape-id="rect-6"]')!
    const rect7 = document.querySelector('rect[data-shape-id="rect-7"]')!
    
    expect(rect5.getAttribute('stroke')).not.toBe('none')
    expect(rect6.getAttribute('stroke')).not.toBe('none')
    expect(rect7.getAttribute('stroke')).not.toBe('none')
  })
})

describe('PR #8: Delete Functionality', () => {
  beforeEach(() => {
    act(() => {
      useCanvasStore.getState().clearShapes()
      useCanvasStore.getState().clearSelection()
      useCanvasStore.getState().setCurrentTool('select')
    })
  })
  
  /**
   * Test 4: Delete key removes selected shape
   * 
   * WHY: Users need a quick way to delete shapes. Delete/Backspace
   * is the standard keyboard shortcut.
   * 
   * WHAT: Select a shape, press Delete, verify it's gone.
   */
  test('Delete key removes selected shape', () => {
    render(<Canvas />)
    
    // Add and select a shape
    act(() => {
      useCanvasStore.getState().addShape({
        id: 'rect-delete-1',
        type: 'rect',
        x: 100,
        y: 100,
        width: 50,
        height: 50,
        rotation: 0,
      })
      useCanvasStore.getState().selectShape('rect-delete-1')
    })
    
    expect(useCanvasStore.getState().shapes.size).toBe(1)
    
    // Press Delete key
    fireEvent.keyDown(document, { key: 'Delete', code: 'Delete' })
    
    // Shape should be removed
    expect(useCanvasStore.getState().shapes.size).toBe(0)
    expect(useCanvasStore.getState().selectedIds.length).toBe(0)
  })
  
  /**
   * Test 5: Backspace key also removes selected shape
   * 
   * WHY: Mac users often use Backspace instead of Delete.
   * Both should work.
   */
  test('Backspace key removes selected shape', () => {
    render(<Canvas />)
    
    // Add and select a shape
    act(() => {
      useCanvasStore.getState().addShape({
        id: 'rect-delete-2',
        type: 'rect',
        x: 100,
        y: 100,
        width: 50,
        height: 50,
        rotation: 0,
      })
      useCanvasStore.getState().selectShape('rect-delete-2')
    })
    
    expect(useCanvasStore.getState().shapes.size).toBe(1)
    
    // Press Backspace key
    fireEvent.keyDown(document, { key: 'Backspace', code: 'Backspace' })
    
    // Shape should be removed
    expect(useCanvasStore.getState().shapes.size).toBe(0)
  })
  
  /**
   * Test 6: Delete removes all selected shapes in multi-selection
   * 
   * WHY: When multiple shapes are selected, Delete should remove all of them.
   */
  test('Delete removes all selected shapes', () => {
    render(<Canvas />)
    
    // Add and select multiple shapes
    act(() => {
      useCanvasStore.getState().addShape({
        id: 'rect-delete-3',
        type: 'rect',
        x: 100,
        y: 100,
        width: 50,
        height: 50,
        rotation: 0,
      })
      useCanvasStore.getState().addShape({
        id: 'rect-delete-4',
        type: 'rect',
        x: 200,
        y: 200,
        width: 50,
        height: 50,
        rotation: 0,
      })
      useCanvasStore.getState().addShape({
        id: 'rect-delete-5',
        type: 'rect',
        x: 300,
        y: 300,
        width: 50,
        height: 50,
        rotation: 0,
      })
      useCanvasStore.getState().selectMultiple(['rect-delete-3', 'rect-delete-4'])
    })
    
    expect(useCanvasStore.getState().shapes.size).toBe(3)
    
    // Press Delete - should remove 2 selected shapes
    fireEvent.keyDown(document, { key: 'Delete' })
    
    // Only 1 shape should remain (the unselected one)
    expect(useCanvasStore.getState().shapes.size).toBe(1)
    expect(useCanvasStore.getState().shapes.has('rect-delete-5')).toBe(true)
  })
  
  /**
   * Test 7: Delete with no selection does nothing
   * 
   * WHY: Pressing Delete with nothing selected shouldn't cause errors.
   */
  test('Delete with no selection does nothing', () => {
    render(<Canvas />)
    
    // Add shapes but don't select any
    act(() => {
      useCanvasStore.getState().addShape({
        id: 'rect-delete-6',
        type: 'rect',
        x: 100,
        y: 100,
        width: 50,
        height: 50,
        rotation: 0,
      })
    })
    
    expect(useCanvasStore.getState().shapes.size).toBe(1)
    
    // Press Delete with nothing selected
    fireEvent.keyDown(document, { key: 'Delete' })
    
    // Shape should still exist
    expect(useCanvasStore.getState().shapes.size).toBe(1)
  })
})

describe('PR #8: Layer Ordering', () => {
  beforeEach(() => {
    act(() => {
      useCanvasStore.getState().clearShapes()
      useCanvasStore.getState().clearSelection()
      useCanvasStore.getState().setCurrentTool('select')
    })
  })
  
  /**
   * Test 8: Bring to front moves shape to highest zIndex
   * 
   * WHY: Shapes overlap. Users need to control which shape appears on top.
   * "Bring to front" is a standard layer operation.
   * 
   * WHAT: Create overlapping shapes, bring one to front, verify order.
   */
  test('Bring to front moves shape to highest zIndex', () => {
    render(<Canvas />)
    
    // Add three overlapping shapes with different zIndex
    act(() => {
      useCanvasStore.getState().addShape({
        id: 'rect-layer-1',
        type: 'rect',
        x: 100,
        y: 100,
        width: 100,
        height: 100,
        rotation: 0,
        zIndex: 1,
      })
      useCanvasStore.getState().addShape({
        id: 'rect-layer-2',
        type: 'rect',
        x: 120,
        y: 120,
        width: 100,
        height: 100,
        rotation: 0,
        zIndex: 2,
      })
      useCanvasStore.getState().addShape({
        id: 'rect-layer-3',
        type: 'rect',
        x: 140,
        y: 140,
        width: 100,
        height: 100,
        rotation: 0,
        zIndex: 3,
      })
      
      // Select the first shape (currently at back)
      useCanvasStore.getState().selectShape('rect-layer-1')
    })
    
    // Bring to front (keyboard shortcut or method call)
    act(() => {
      useCanvasStore.getState().bringToFront('rect-layer-1')
    })
    
    // rect-layer-1 should now have the highest zIndex
    const shape = useCanvasStore.getState().shapes.get('rect-layer-1')!
    const allShapes = Array.from(useCanvasStore.getState().shapes.values())
    const maxZIndex = Math.max(...allShapes.map(s => s.zIndex || 0))
    
    expect(shape.zIndex).toBe(maxZIndex)
  })
  
  /**
   * Test 9: Send to back moves shape to lowest zIndex
   * 
   * WHY: Opposite of bring to front - send a shape behind others.
   */
  test('Send to back moves shape to lowest zIndex', () => {
    render(<Canvas />)
    
    // Add three shapes
    act(() => {
      useCanvasStore.getState().addShape({
        id: 'rect-layer-4',
        type: 'rect',
        x: 100,
        y: 100,
        width: 100,
        height: 100,
        rotation: 0,
        zIndex: 1,
      })
      useCanvasStore.getState().addShape({
        id: 'rect-layer-5',
        type: 'rect',
        x: 120,
        y: 120,
        width: 100,
        height: 100,
        rotation: 0,
        zIndex: 2,
      })
      useCanvasStore.getState().addShape({
        id: 'rect-layer-6',
        type: 'rect',
        x: 140,
        y: 140,
        width: 100,
        height: 100,
        rotation: 0,
        zIndex: 3,
      })
      
      // Select the top shape
      useCanvasStore.getState().selectShape('rect-layer-6')
    })
    
    // Send to back
    act(() => {
      useCanvasStore.getState().sendToBack('rect-layer-6')
    })
    
    // rect-layer-6 should now have the lowest zIndex
    const shape = useCanvasStore.getState().shapes.get('rect-layer-6')!
    const allShapes = Array.from(useCanvasStore.getState().shapes.values())
    const minZIndex = Math.min(...allShapes.map(s => s.zIndex || 0))
    
    expect(shape.zIndex).toBe(minZIndex)
  })
  
  /**
   * Test 10: Shapes render in correct zIndex order
   * 
   * WHY: The visual order in the DOM should match the zIndex values.
   * Shapes with higher zIndex should appear later in the SVG (on top).
   */
  test('Shapes render in correct zIndex order', () => {
    render(<Canvas />)
    
    // Add shapes with explicit zIndex
    act(() => {
      useCanvasStore.getState().addShape({
        id: 'rect-layer-7',
        type: 'rect',
        x: 100,
        y: 100,
        width: 50,
        height: 50,
        rotation: 0,
        zIndex: 3, // Should render last (on top)
      })
      useCanvasStore.getState().addShape({
        id: 'rect-layer-8',
        type: 'rect',
        x: 200,
        y: 200,
        width: 50,
        height: 50,
        rotation: 0,
        zIndex: 1, // Should render first (at bottom)
      })
      useCanvasStore.getState().addShape({
        id: 'rect-layer-9',
        type: 'rect',
        x: 300,
        y: 300,
        width: 50,
        height: 50,
        rotation: 0,
        zIndex: 2, // Should render middle
      })
    })
    
    // Get all rect elements (excluding grid)
    const rects = Array.from(document.querySelectorAll('rect[data-shape-id]'))
    const ids = rects.map(r => r.getAttribute('data-shape-id'))
    
    // Should be ordered by zIndex: layer-8 (1), layer-9 (2), layer-7 (3)
    expect(ids.indexOf('rect-layer-8')).toBeLessThan(ids.indexOf('rect-layer-9'))
    expect(ids.indexOf('rect-layer-9')).toBeLessThan(ids.indexOf('rect-layer-7'))
  })
})

