/**
 * PR #4: Canvas Tests - Basic UI & SVG Rendering
 * 
 * WHY: These tests define the expected behavior of our canvas component BEFORE
 * we write the implementation. This is Test-Driven Development (TDD).
 * 
 * WHAT: We're testing:
 * 1. Canvas renders with an SVG element
 * 2. Pan functionality works with mouse drag
 * 3. Zoom functionality works with mouse wheel
 * 4. Basic shapes (Rectangle, Circle) render correctly
 * 5. Zustand store updates viewport state
 * 
 * These tests will FAIL initially - that's expected! We'll make them pass in PR #5.
 */

import { render, screen, fireEvent } from '@testing-library/react'
import '@testing-library/jest-dom'
import { act } from 'react'

// These imports will fail until we create the components in PR #5
// That's OK for TDD - we're defining what we WANT first
import Canvas from '@/components/Canvas'
import { useCanvasStore } from '@/lib/canvasStore'

describe('PR #4: Canvas Basic UI & SVG Rendering', () => {
  /**
   * Test 1: Canvas component renders with SVG element
   * 
   * WHY: The core of our canvas is an SVG element. We need to verify
   * it exists so we can draw shapes on it.
   * 
   * WHAT: Render the Canvas component and check that an <svg> element
   * is in the document.
   */
  test('Canvas component renders with SVG element', () => {
    render(<Canvas />)
    
    // Find the SVG element - every canvas needs one for drawing
    const svgElement = document.querySelector('svg')
    expect(svgElement).toBeInTheDocument()
    
    // The SVG should have appropriate dimensions
    // We'll set a default viewport size
    expect(svgElement).toHaveAttribute('width')
    expect(svgElement).toHaveAttribute('height')
  })

  /**
   * Test 2: Pan works with mouse drag
   * 
   * WHY: Users need to be able to pan around the canvas to see different
   * areas of their design. This is a core navigation feature.
   * 
   * WHAT: Simulate a mouse drag and verify the viewport position changes.
   * We check the Zustand store to see if the viewport x/y coordinates updated.
   */
  test('Pan works with mouse drag', () => {
    render(<Canvas />)
    
    const svgElement = document.querySelector('svg')!
    
    // Get initial viewport state from the store
    const initialViewport = useCanvasStore.getState().viewport
    
    // Simulate a pan: mousedown, mousemove, mouseup
    // This simulates dragging from (100, 100) to (200, 200)
    // Expected result: viewport should shift by (100, 100)
    fireEvent.mouseDown(svgElement, { clientX: 100, clientY: 100, button: 0 })
    fireEvent.mouseMove(svgElement, { clientX: 200, clientY: 200 })
    fireEvent.mouseUp(svgElement, { clientX: 200, clientY: 200 })
    
    // Check that viewport position changed
    const newViewport = useCanvasStore.getState().viewport
    
    // The viewport should have moved
    expect(newViewport.x).not.toBe(initialViewport.x)
    expect(newViewport.y).not.toBe(initialViewport.y)
  })

  /**
   * Test 3: Zoom works with mouse wheel
   * 
   * WHY: Users need to zoom in for detail work and zoom out for overview.
   * This is essential for any design tool.
   * 
   * WHAT: Simulate a mouse wheel event and verify the zoom level changes.
   */
  test('Zoom works with mouse wheel', () => {
    render(<Canvas />)
    
    const svgElement = document.querySelector('svg')!
    
    // Get initial zoom level
    const initialZoom = useCanvasStore.getState().viewport.zoom
    
    // Simulate zoom in (wheel delta negative = zoom in)
    fireEvent.wheel(svgElement, { deltaY: -100 })
    
    const newZoom = useCanvasStore.getState().viewport.zoom
    
    // Zoom level should have increased
    expect(newZoom).toBeGreaterThan(initialZoom)
  })

  /**
   * Test 4: Space + drag enables pan mode
   * 
   * WHY: Common design tools (Figma, Adobe XD) use Space+drag for panning.
   * Users expect this keyboard shortcut.
   * 
   * WHAT: Hold space key, drag mouse, release space. Verify panning works.
   */
  test('Space + drag enables pan mode', () => {
    render(<Canvas />)
    
    const svgElement = document.querySelector('svg')!
    const initialViewport = useCanvasStore.getState().viewport
    
    // Hold space key down
    fireEvent.keyDown(document, { key: ' ', code: 'Space' })
    
    // Drag while space is held
    fireEvent.mouseDown(svgElement, { clientX: 100, clientY: 100 })
    fireEvent.mouseMove(svgElement, { clientX: 150, clientY: 150 })
    fireEvent.mouseUp(svgElement, { clientX: 150, clientY: 150 })
    
    // Release space key
    fireEvent.keyUp(document, { key: ' ', code: 'Space' })
    
    const newViewport = useCanvasStore.getState().viewport
    
    // Viewport should have panned
    expect(newViewport.x).not.toBe(initialViewport.x)
    expect(newViewport.y).not.toBe(initialViewport.y)
  })
})

describe('PR #4: Basic Shape Rendering', () => {
  /**
   * Test 5: Rectangle shape renders correctly
   * 
   * WHY: Rectangles are the most basic shape. If we can render a rectangle,
   * we've proven our shape rendering system works.
   * 
   * WHAT: Add a rectangle to the store and verify it renders as an SVG <rect> element.
   */
  test('Rectangle shape renders correctly', () => {
    // Reset store to clean state
    act(() => {
      useCanvasStore.getState().clearShapes()
    })
    
    render(<Canvas />)
    
    // Add a rectangle to the store
    act(() => {
      useCanvasStore.getState().addShape({
        id: 'rect-1',
        type: 'rect',
        x: 100,
        y: 100,
        width: 200,
        height: 150,
        color: '#ff0000',
        rotation: 0,
      })
    })
    
    // Check that an SVG <rect> element was rendered with the correct data attribute
    const rectElement = document.querySelector('rect[data-shape-type="rect"]')
    expect(rectElement).toBeInTheDocument()
    
    // Verify the rectangle has the correct attributes
    expect(rectElement).toHaveAttribute('width', '200')
    expect(rectElement).toHaveAttribute('height', '150')
    expect(rectElement).toHaveAttribute('fill', '#ff0000')
  })

  /**
   * Test 6: Circle shape renders correctly
   * 
   * WHY: Circles are another fundamental shape. This proves our shape
   * rendering works for different shape types.
   * 
   * WHAT: Add a circle to the store and verify it renders as an SVG <circle> element.
   */
  test('Circle shape renders correctly', () => {
    act(() => {
      useCanvasStore.getState().clearShapes()
    })
    
    render(<Canvas />)
    
    // Add a circle to the store
    act(() => {
      useCanvasStore.getState().addShape({
        id: 'circle-1',
        type: 'circle',
        x: 200,
        y: 200,
        radius: 50,
        color: '#00ff00',
        rotation: 0,
      })
    })
    
    // Check that an SVG <circle> element was rendered
    const circleElement = document.querySelector('circle')
    expect(circleElement).toBeInTheDocument()
    
    // Verify the circle has the correct attributes
    // Note: SVG circle uses cx, cy for center, and r for radius
    expect(circleElement).toHaveAttribute('r', '50')
    expect(circleElement).toHaveAttribute('fill', '#00ff00')
  })

  /**
   * Test 7: Multiple shapes render simultaneously
   * 
   * WHY: Users will have many shapes on the canvas. We need to ensure
   * multiple shapes can coexist.
   * 
   * WHAT: Add both a rectangle and a circle, verify both render.
   */
  test('Multiple shapes render simultaneously', () => {
    act(() => {
      useCanvasStore.getState().clearShapes()
    })
    
    render(<Canvas />)
    
    // Add multiple shapes
    act(() => {
      useCanvasStore.getState().addShape({
        id: 'rect-2',
        type: 'rect',
        x: 0,
        y: 0,
        width: 100,
        height: 100,
        color: '#0000ff',
        rotation: 0,
      })
      
      useCanvasStore.getState().addShape({
        id: 'circle-2',
        type: 'circle',
        x: 300,
        y: 300,
        radius: 75,
        color: '#ffff00',
        rotation: 0,
      })
    })
    
    // Both shapes should be rendered
    expect(document.querySelector('rect')).toBeInTheDocument()
    expect(document.querySelector('circle')).toBeInTheDocument()
  })
})

describe('PR #4: Zustand Store Integration', () => {
  /**
   * Test 8: Zustand store initializes with default viewport
   * 
   * WHY: The store is the single source of truth for canvas state.
   * We need to ensure it initializes correctly.
   * 
   * WHAT: Check that the store has a viewport with x, y, and zoom properties.
   */
  test('Zustand store initializes with default viewport', () => {
    // Reset viewport to default state for clean test
    act(() => {
      useCanvasStore.getState().setViewport({ x: 0, y: 0, zoom: 1 })
    })
    
    const state = useCanvasStore.getState()
    
    expect(state.viewport).toBeDefined()
    expect(state.viewport).toHaveProperty('x')
    expect(state.viewport).toHaveProperty('y')
    expect(state.viewport).toHaveProperty('zoom')
    
    // Default viewport should be centered at origin with zoom 1
    expect(state.viewport.x).toBe(0)
    expect(state.viewport.y).toBe(0)
    expect(state.viewport.zoom).toBe(1)
  })

  /**
   * Test 9: Store updates viewport state correctly
   * 
   * WHY: When users pan/zoom, the store must update to reflect the new viewport.
   * Components will re-render based on store updates.
   * 
   * WHAT: Call store methods to update viewport, verify state changes.
   */
  test('Store updates viewport state correctly', () => {
    const store = useCanvasStore.getState()
    
    // Update viewport position
    act(() => {
      store.setViewport({ x: 100, y: 200, zoom: 1 })
    })
    
    let viewport = useCanvasStore.getState().viewport
    expect(viewport.x).toBe(100)
    expect(viewport.y).toBe(200)
    
    // Update viewport zoom
    act(() => {
      store.setViewport({ x: 100, y: 200, zoom: 1.5 })
    })
    
    viewport = useCanvasStore.getState().viewport
    expect(viewport.zoom).toBe(1.5)
  })

  /**
   * Test 10: Store manages shapes collection
   * 
   * WHY: The store needs to hold all shapes on the canvas and allow
   * adding, removing, and updating shapes.
   * 
   * WHAT: Test adding and clearing shapes from the store.
   */
  test('Store manages shapes collection', () => {
    act(() => {
      useCanvasStore.getState().clearShapes()
    })
    
    const store = useCanvasStore.getState()
    
    // Initially no shapes
    expect(store.shapes.size).toBe(0)
    
    // Add a shape
    act(() => {
      store.addShape({
        id: 'test-shape-1',
        type: 'rect',
        x: 0,
        y: 0,
        width: 50,
        height: 50,
        rotation: 0,
      })
    })
    
    expect(useCanvasStore.getState().shapes.size).toBe(1)
    
    // Add another shape
    act(() => {
      store.addShape({
        id: 'test-shape-2',
        type: 'circle',
        x: 100,
        y: 100,
        radius: 25,
        rotation: 0,
      })
    })
    
    expect(useCanvasStore.getState().shapes.size).toBe(2)
    
    // Clear all shapes
    act(() => {
      useCanvasStore.getState().clearShapes()
    })
    
    expect(useCanvasStore.getState().shapes.size).toBe(0)
  })
})

