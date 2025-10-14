/**
 * PR #6: Canvas Tests - Shape Creation & Manipulation
 * 
 * WHY: These tests define how users will interact with shapes on the canvas.
 * This is the next layer of functionality after basic rendering.
 * 
 * WHAT: We're testing:
 * 1. Click to create a shape
 * 2. Click to select a shape
 * 3. Drag to move selected shape
 * 4. Drag handle to resize shape
 * 
 * These tests will FAIL initially - that's TDD! We'll make them pass in PR #7.
 */

import { render, screen, fireEvent } from '@testing-library/react'
import '@testing-library/jest-dom'
import { act } from 'react'

import Canvas from '@/components/Canvas'
import { useCanvasStore } from '@/lib/canvasStore'

describe('PR #6: Shape Creation', () => {
  beforeEach(() => {
    // Clean state before each test
    act(() => {
      useCanvasStore.getState().clearShapes()
      useCanvasStore.getState().clearSelection()
      useCanvasStore.getState().setViewport({ x: 0, y: 0, zoom: 1 })
    })
  })
  
  /**
   * Test 1: Click to create a shape
   * 
   * WHY: Users need a way to add shapes to the canvas. The standard
   * interaction is: select a tool (e.g., rectangle), click on canvas.
   * 
   * WHAT: 
   * 1. Set tool to 'rect'
   * 2. Click on canvas
   * 3. Verify a rectangle was added to the store
   * 
   * HOW: We'll need to add a "currentTool" to the store and handle
   * canvas clicks to create shapes based on the current tool.
   */
  test('Click to create a rectangle shape', () => {
    render(<Canvas />)
    
    const svgElement = document.querySelector('svg')!
    
    // Set tool to rectangle
    act(() => {
      useCanvasStore.getState().setCurrentTool('rect')
    })
    
    // Click on canvas to create a shape at position (200, 150)
    fireEvent.click(svgElement, { clientX: 200, clientY: 150 })
    
    // Verify a shape was added
    const shapes = useCanvasStore.getState().shapes
    expect(shapes.size).toBe(1)
    
    // Verify it's a rectangle
    const shape = Array.from(shapes.values())[0]
    expect(shape.type).toBe('rect')
    expect(shape.x).toBeDefined()
    expect(shape.y).toBeDefined()
  })
  
  /**
   * Test 2: Click to create a circle shape
   * 
   * WHY: Test that tool switching works - user can create different shape types.
   */
  test('Click to create a circle shape', () => {
    render(<Canvas />)
    
    const svgElement = document.querySelector('svg')!
    
    // Set tool to circle
    act(() => {
      useCanvasStore.getState().setCurrentTool('circle')
    })
    
    // Click on canvas
    fireEvent.click(svgElement, { clientX: 300, clientY: 200 })
    
    // Verify a circle was added
    const shapes = useCanvasStore.getState().shapes
    expect(shapes.size).toBe(1)
    
    const shape = Array.from(shapes.values())[0]
    expect(shape.type).toBe('circle')
  })
  
  /**
   * Test 3: Drag to create a shape with specific size
   * 
   * WHY: Many design tools let you drag to define the size of a shape
   * as you create it (like dragging to draw a rectangle).
   * 
   * WHAT: Click and drag to create a rectangle with custom dimensions.
   */
  test('Drag to create a shape with specific size', () => {
    render(<Canvas />)
    
    const svgElement = document.querySelector('svg')!
    
    // Set tool to rectangle
    act(() => {
      useCanvasStore.getState().setCurrentTool('rect')
    })
    
    // Drag from (100, 100) to (300, 250) to create 200x150 rectangle
    fireEvent.mouseDown(svgElement, { clientX: 100, clientY: 100, button: 0 })
    fireEvent.mouseMove(svgElement, { clientX: 300, clientY: 250 })
    fireEvent.mouseUp(svgElement, { clientX: 300, clientY: 250 })
    
    // Verify shape was created with correct dimensions
    const shapes = useCanvasStore.getState().shapes
    expect(shapes.size).toBe(1)
    
    const shape = Array.from(shapes.values())[0]
    expect(shape.type).toBe('rect')
    // Note: Exact values depend on implementation, but should be non-zero
    if (shape.type === 'rect') {
      expect(shape.width).toBeGreaterThan(0)
      expect(shape.height).toBeGreaterThan(0)
    }
  })
})

describe('PR #6: Shape Selection', () => {
  beforeEach(() => {
    act(() => {
      useCanvasStore.getState().clearShapes()
      useCanvasStore.getState().clearSelection()
      useCanvasStore.getState().setCurrentTool('select')
    })
  })
  
  /**
   * Test 4: Click to select a shape
   * 
   * WHY: Users need to select shapes before they can manipulate them.
   * Clicking a shape should select it.
   * 
   * WHAT: Add a shape, click on it, verify it's in selectedIds.
   */
  test('Click to select a shape', () => {
    render(<Canvas />)
    
    // Add a rectangle
    act(() => {
      useCanvasStore.getState().addShape({
        id: 'test-rect-1',
        type: 'rect',
        x: 100,
        y: 100,
        width: 100,
        height: 100,
        rotation: 0,
      })
    })
    
    // Find and click the rectangle
    const rectElement = document.querySelector('rect[data-shape-id="test-rect-1"]')!
    fireEvent.click(rectElement)
    
    // Verify it's selected
    const selectedIds = useCanvasStore.getState().selectedIds
    expect(selectedIds).toContain('test-rect-1')
  })
  
  /**
   * Test 5: Selected shape shows visual indicator
   * 
   * WHY: Users need visual feedback to know which shape is selected.
   * Selected shapes should have a different appearance (stroke, highlight, etc.)
   */
  test('Selected shape shows visual indicator', () => {
    render(<Canvas />)
    
    // Add and select a shape
    act(() => {
      useCanvasStore.getState().addShape({
        id: 'test-rect-2',
        type: 'rect',
        x: 100,
        y: 100,
        width: 100,
        height: 100,
        rotation: 0,
      })
      useCanvasStore.getState().selectShape('test-rect-2')
    })
    
    // Find the rectangle
    const rectElement = document.querySelector('rect[data-shape-id="test-rect-2"]')!
    
    // Verify it has a stroke (selection indicator)
    expect(rectElement).toHaveAttribute('stroke')
    const stroke = rectElement.getAttribute('stroke')
    expect(stroke).not.toBe('none')
  })
  
  /**
   * Test 6: Click empty canvas deselects shapes
   * 
   * WHY: Users need a way to deselect. Standard behavior is clicking
   * empty canvas clears selection.
   */
  test('Click empty canvas deselects shapes', () => {
    render(<Canvas />)
    
    // Add and select a shape
    act(() => {
      useCanvasStore.getState().addShape({
        id: 'test-rect-3',
        type: 'rect',
        x: 100,
        y: 100,
        width: 100,
        height: 100,
        rotation: 0,
      })
      useCanvasStore.getState().selectShape('test-rect-3')
    })
    
    // Verify it's selected
    expect(useCanvasStore.getState().selectedIds).toContain('test-rect-3')
    
    // Click empty canvas
    const svgElement = document.querySelector('svg')!
    fireEvent.click(svgElement)
    
    // Verify selection is cleared
    expect(useCanvasStore.getState().selectedIds).toHaveLength(0)
  })
})

describe('PR #6: Shape Movement', () => {
  beforeEach(() => {
    act(() => {
      useCanvasStore.getState().clearShapes()
      useCanvasStore.getState().clearSelection()
      useCanvasStore.getState().setCurrentTool('select') // Use select tool for moving
    })
  })
  
  /**
   * Test 7: Drag to move selected shape
   * 
   * WHY: Moving shapes is a fundamental operation in design tools.
   * Users expect to drag shapes to reposition them.
   * 
   * WHAT: Select a shape, drag it, verify its position changed.
   */
  test('Drag to move selected shape', () => {
    render(<Canvas />)
    
    // Add a rectangle at initial position
    act(() => {
      useCanvasStore.getState().addShape({
        id: 'test-rect-4',
        type: 'rect',
        x: 100,
        y: 100,
        width: 50,
        height: 50,
        rotation: 0,
      })
      useCanvasStore.getState().selectShape('test-rect-4')
    })
    
    const initialShape = useCanvasStore.getState().shapes.get('test-rect-4')!
    const initialX = initialShape.x
    const initialY = initialShape.y
    
    // Find the rectangle element
    const rectElement = document.querySelector('rect[data-shape-id="test-rect-4"]')!
    
    // Drag the shape by (50, 30)
    fireEvent.mouseDown(rectElement, { clientX: 125, clientY: 125, button: 0 })
    fireEvent.mouseMove(document, { clientX: 175, clientY: 155 })
    fireEvent.mouseUp(document, { clientX: 175, clientY: 155 })
    
    // Verify shape moved
    const movedShape = useCanvasStore.getState().shapes.get('test-rect-4')!
    expect(movedShape.x).not.toBe(initialX)
    expect(movedShape.y).not.toBe(initialY)
  })
  
  /**
   * Test 8: Cannot move unselected shape
   * 
   * WHY: Only selected shapes should be moveable. This prevents
   * accidental moves when user is interacting with other shapes.
   */
  test('Cannot move unselected shape', () => {
    render(<Canvas />)
    
    // Add a rectangle but DON'T select it
    act(() => {
      useCanvasStore.getState().addShape({
        id: 'test-rect-5',
        type: 'rect',
        x: 100,
        y: 100,
        width: 50,
        height: 50,
        rotation: 0,
      })
    })
    
    const initialShape = useCanvasStore.getState().shapes.get('test-rect-5')!
    const initialX = initialShape.x
    const initialY = initialShape.y
    
    // Try to drag (should not move because it's not selected)
    const rectElement = document.querySelector('rect[data-shape-id="test-rect-5"]')!
    fireEvent.mouseDown(rectElement, { clientX: 125, clientY: 125 })
    fireEvent.mouseMove(document, { clientX: 200, clientY: 200 })
    fireEvent.mouseUp(document)
    
    // Since dragging an unselected shape should first SELECT it,
    // the position should remain the same (no move yet)
    const shape = useCanvasStore.getState().shapes.get('test-rect-5')!
    expect(shape.x).toBe(initialX)
    expect(shape.y).toBe(initialY)
  })
})

describe('PR #6: Shape Resizing', () => {
  beforeEach(() => {
    act(() => {
      useCanvasStore.getState().clearShapes()
      useCanvasStore.getState().clearSelection()
    })
  })
  
  /**
   * Test 9: Selected shape shows resize handles
   * 
   * WHY: Users need visual cues to know they can resize a shape.
   * Selected shapes should show resize handles (corner circles/squares).
   * 
   * WHAT: Select a shape, verify resize handles render.
   */
  test('Selected shape shows resize handles', () => {
    render(<Canvas />)
    
    // Add and select a rectangle
    act(() => {
      useCanvasStore.getState().addShape({
        id: 'test-rect-6',
        type: 'rect',
        x: 100,
        y: 100,
        width: 100,
        height: 100,
        rotation: 0,
      })
      useCanvasStore.getState().selectShape('test-rect-6')
    })
    
    // Look for resize handles (they might be circles or rects with a specific class/data attribute)
    // This will be implemented in PR #7, but we define the expected behavior here
    const handles = document.querySelectorAll('[data-handle-type="resize"]')
    
    // Should have multiple handles (typically 8: 4 corners + 4 edges, or at least 4 corners)
    expect(handles.length).toBeGreaterThanOrEqual(4)
  })
  
  /**
   * Test 10: Drag corner handle to resize shape
   * 
   * WHY: Resizing is a core shape manipulation operation.
   * Dragging corner handles should change the shape's dimensions.
   * 
   * WHAT: Select a shape, drag a corner handle, verify size changed.
   */
  test('Drag corner handle to resize shape', () => {
    render(<Canvas />)
    
    // Add and select a rectangle
    act(() => {
      useCanvasStore.getState().addShape({
        id: 'test-rect-7',
        type: 'rect',
        x: 100,
        y: 100,
        width: 100,
        height: 100,
        rotation: 0,
      })
      useCanvasStore.getState().selectShape('test-rect-7')
    })
    
    const initialShape = useCanvasStore.getState().shapes.get('test-rect-7')!
    const initialWidth = initialShape.type === 'rect' ? initialShape.width : 0
    const initialHeight = initialShape.type === 'rect' ? initialShape.height : 0
    
    // Find a corner handle (e.g., bottom-right)
    // Handles will have data attributes like data-handle-type="resize" and data-handle-position="br"
    const handle = document.querySelector('[data-handle-position="br"]')
    expect(handle).toBeInTheDocument()
    
    // Drag the handle to resize
    fireEvent.mouseDown(handle!, { clientX: 200, clientY: 200, button: 0 })
    fireEvent.mouseMove(document, { clientX: 250, clientY: 250 })
    fireEvent.mouseUp(document)
    
    // Verify shape was resized
    const resizedShape = useCanvasStore.getState().shapes.get('test-rect-7')!
    if (resizedShape.type === 'rect') {
      expect(resizedShape.width).not.toBe(initialWidth)
      expect(resizedShape.height).not.toBe(initialHeight)
      // Width and height should have increased
      expect(resizedShape.width).toBeGreaterThan(initialWidth)
      expect(resizedShape.height).toBeGreaterThan(initialHeight)
    }
  })
  
  /**
   * Test 11: Drag edge handle to resize shape in one dimension
   * 
   * WHY: Sometimes users want to resize only width or height, not both.
   * Edge handles (top, right, bottom, left) should resize in one dimension.
   */
  test('Drag edge handle to resize shape in one dimension', () => {
    render(<Canvas />)
    
    // Add and select a rectangle
    act(() => {
      useCanvasStore.getState().addShape({
        id: 'test-rect-8',
        type: 'rect',
        x: 100,
        y: 100,
        width: 100,
        height: 100,
        rotation: 0,
      })
      useCanvasStore.getState().selectShape('test-rect-8')
    })
    
    const initialShape = useCanvasStore.getState().shapes.get('test-rect-8')!
    const initialWidth = initialShape.type === 'rect' ? initialShape.width : 0
    const initialHeight = initialShape.type === 'rect' ? initialShape.height : 0
    
    // Find right edge handle
    const handle = document.querySelector('[data-handle-position="r"]')
    expect(handle).toBeInTheDocument()
    
    // Drag right handle to the right (should only change width)
    fireEvent.mouseDown(handle!, { clientX: 200, clientY: 150, button: 0 })
    fireEvent.mouseMove(document, { clientX: 250, clientY: 150 })
    fireEvent.mouseUp(document)
    
    // Verify only width changed, height stayed the same
    const resizedShape = useCanvasStore.getState().shapes.get('test-rect-8')!
    if (resizedShape.type === 'rect') {
      expect(resizedShape.width).toBeGreaterThan(initialWidth)
      expect(resizedShape.height).toBe(initialHeight) // Height should not change
    }
  })
})

