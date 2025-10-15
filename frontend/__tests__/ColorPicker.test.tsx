/**
 * PR #27: Color Picker Tests
 * 
 * WHY: Color editing is fundamental in design tools (Figma-like).
 * Users need a simple way to change shape colors.
 * 
 * WHAT: These tests define the color picker behavior:
 * 1. Properties panel shows when shape(s) selected
 * 2. Color picker displays current shape color
 * 3. Changing color updates selected shape
 * 4. Works with multi-select (updates all shapes)
 * 5. Panel hides when nothing selected
 * 
 * These tests will FAIL initially - that's TDD! We'll make them pass in the implementation.
 */

import { render, screen, fireEvent } from '@testing-library/react'
import '@testing-library/jest-dom'
import { act } from 'react'
import Canvas from '@/components/Canvas'
import { useCanvasStore } from '@/lib/canvasStore'

// Mock WebSocket provider
const mockProvider = null
const mockUsers = []
const mockUpdateCursor = jest.fn()
const mockCurrentUser = { id: 'test-user', name: 'Test User', color: '#3b82f6' }

describe('PR #27: Color Picker', () => {
  beforeEach(() => {
    // Clean state before each test
    act(() => {
      useCanvasStore.getState().clearShapes()
      useCanvasStore.getState().clearSelection()
      useCanvasStore.getState().setCurrentTool('select')
    })
  })

  /**
   * Test 1: Properties panel shows when shape selected
   * 
   * WHY: Users need visual feedback that they can edit properties.
   * The panel should appear when a shape is selected.
   */
  test('Properties panel appears when shape is selected', () => {
    render(
      <Canvas 
        provider={mockProvider}
        users={mockUsers}
        updateCursor={mockUpdateCursor}
        currentUser={mockCurrentUser}
      />
    )

    // Add and select a shape
    act(() => {
      useCanvasStore.getState().addShape({
        id: 'rect-1',
        type: 'rect',
        x: 100,
        y: 100,
        width: 50,
        height: 50,
        rotation: 0,
        color: '#3b82f6',
      })
      useCanvasStore.getState().selectShape('rect-1')
    })

    // Look for properties panel or color input
    const colorInput = screen.queryByLabelText(/color/i) || screen.queryByTestId('color-picker')
    expect(colorInput).toBeInTheDocument()
  })

  /**
   * Test 2: Properties panel hidden when nothing selected
   * 
   * WHY: Panel should only show when relevant (when shapes are selected).
   */
  test('Properties panel hidden when no shapes selected', () => {
    render(
      <Canvas 
        provider={mockProvider}
        users={mockUsers}
        updateCursor={mockUpdateCursor}
        currentUser={mockCurrentUser}
      />
    )

    // Add shape but don't select it
    act(() => {
      useCanvasStore.getState().addShape({
        id: 'rect-1',
        type: 'rect',
        x: 100,
        y: 100,
        width: 50,
        height: 50,
        rotation: 0,
        color: '#3b82f6',
      })
    })

    // Properties panel should not be visible
    const colorInput = screen.queryByLabelText(/color/i) || screen.queryByTestId('color-picker')
    expect(colorInput).not.toBeInTheDocument()
  })

  /**
   * Test 3: Color picker displays current shape color
   * 
   * WHY: Users need to see the current color before changing it.
   * The color input should reflect the selected shape's color.
   */
  test('Color picker shows current shape color', () => {
    render(
      <Canvas 
        provider={mockProvider}
        users={mockUsers}
        updateCursor={mockUpdateCursor}
        currentUser={mockCurrentUser}
      />
    )

    // Add blue rectangle
    act(() => {
      useCanvasStore.getState().addShape({
        id: 'rect-1',
        type: 'rect',
        x: 100,
        y: 100,
        width: 50,
        height: 50,
        rotation: 0,
        color: '#3b82f6',
      })
      useCanvasStore.getState().selectShape('rect-1')
    })

    // Find color input and verify it shows blue
    const colorInput = screen.getByTestId('color-picker') as HTMLInputElement
    expect(colorInput.value).toBe('#3b82f6')
  })

  /**
   * Test 4: Changing color updates selected shape
   * 
   * WHY: Core functionality - users change color via the picker,
   * and the shape should update in real-time.
   */
  test('Changing color picker updates selected shape', () => {
    render(
      <Canvas 
        provider={mockProvider}
        users={mockUsers}
        updateCursor={mockUpdateCursor}
        currentUser={mockCurrentUser}
      />
    )

    // Add blue rectangle
    act(() => {
      useCanvasStore.getState().addShape({
        id: 'rect-1',
        type: 'rect',
        x: 100,
        y: 100,
        width: 50,
        height: 50,
        rotation: 0,
        color: '#3b82f6',
      })
      useCanvasStore.getState().selectShape('rect-1')
    })

    // Change color to red
    const colorInput = screen.getByTestId('color-picker')
    act(() => {
      fireEvent.change(colorInput, { target: { value: '#ff0000' } })
    })

    // Verify shape color updated
    const shape = useCanvasStore.getState().shapes.get('rect-1')
    expect(shape?.color).toBe('#ff0000')
  })

  /**
   * Test 5: Color picker works with multi-select
   * 
   * WHY: Users often want to change color of multiple shapes at once.
   * All selected shapes should update to the new color.
   */
  test('Changing color updates all selected shapes', () => {
    render(
      <Canvas 
        provider={mockProvider}
        users={mockUsers}
        updateCursor={mockUpdateCursor}
        currentUser={mockCurrentUser}
      />
    )

    // Add three shapes with different colors
    act(() => {
      useCanvasStore.getState().addShape({
        id: 'rect-1',
        type: 'rect',
        x: 100,
        y: 100,
        width: 50,
        height: 50,
        rotation: 0,
        color: '#3b82f6',
      })
      useCanvasStore.getState().addShape({
        id: 'circle-1',
        type: 'circle',
        x: 200,
        y: 200,
        width: 60,
        height: 60,
        rotation: 0,
        color: '#10b981',
      })
      useCanvasStore.getState().addShape({
        id: 'line-1',
        type: 'line',
        x: 300,
        y: 300,
        x2: 400,
        y2: 400,
        rotation: 0,
        color: '#ef4444',
      })
      // Select all three
      useCanvasStore.getState().selectMultiple(['rect-1', 'circle-1', 'line-1'])
    })

    // Change color to purple
    const colorInput = screen.getByTestId('color-picker')
    act(() => {
      fireEvent.change(colorInput, { target: { value: '#9333ea' } })
    })

    // Verify all shapes updated to purple
    const shapes = useCanvasStore.getState().shapes
    expect(shapes.get('rect-1')?.color).toBe('#9333ea')
    expect(shapes.get('circle-1')?.color).toBe('#9333ea')
    expect(shapes.get('line-1')?.color).toBe('#9333ea')
  })

  /**
   * Test 6: Color picker works with circles
   * 
   * WHY: Verify color picker works for all shape types, not just rectangles.
   */
  test('Color picker works with circle shapes', () => {
    render(
      <Canvas 
        provider={mockProvider}
        users={mockUsers}
        updateCursor={mockUpdateCursor}
        currentUser={mockCurrentUser}
      />
    )

    // Add green circle
    act(() => {
      useCanvasStore.getState().addShape({
        id: 'circle-1',
        type: 'circle',
        x: 200,
        y: 200,
        width: 60,
        height: 60,
        rotation: 0,
        color: '#10b981',
      })
      useCanvasStore.getState().selectShape('circle-1')
    })

    // Verify color picker shows green
    const colorInput = screen.getByTestId('color-picker') as HTMLInputElement
    expect(colorInput.value).toBe('#10b981')

    // Change to yellow
    act(() => {
      fireEvent.change(colorInput, { target: { value: '#fbbf24' } })
    })

    // Verify circle updated
    const circle = useCanvasStore.getState().shapes.get('circle-1')
    expect(circle?.color).toBe('#fbbf24')
  })

  /**
   * Test 7: Color picker works with lines
   * 
   * WHY: Lines also have color (stroke color) and should be editable.
   */
  test('Color picker works with line shapes', () => {
    render(
      <Canvas 
        provider={mockProvider}
        users={mockUsers}
        updateCursor={mockUpdateCursor}
        currentUser={mockCurrentUser}
      />
    )

    // Add red line
    act(() => {
      useCanvasStore.getState().addShape({
        id: 'line-1',
        type: 'line',
        x: 100,
        y: 100,
        x2: 200,
        y2: 200,
        rotation: 0,
        color: '#ef4444',
      })
      useCanvasStore.getState().selectShape('line-1')
    })

    // Verify color picker shows red
    const colorInput = screen.getByTestId('color-picker') as HTMLInputElement
    expect(colorInput.value).toBe('#ef4444')

    // Change to blue
    act(() => {
      fireEvent.change(colorInput, { target: { value: '#3b82f6' } })
    })

    // Verify line updated
    const line = useCanvasStore.getState().shapes.get('line-1')
    expect(line?.color).toBe('#3b82f6')
  })

  /**
   * Test 8: Text shapes don't show color picker (or show text color)
   * 
   * WHY: Text shapes have color for the text, but we may handle them differently.
   * For now, let's test that text shapes can also change color.
   */
  test('Color picker works with text shapes', () => {
    render(
      <Canvas 
        provider={mockProvider}
        users={mockUsers}
        updateCursor={mockUpdateCursor}
        currentUser={mockCurrentUser}
      />
    )

    // Add black text
    act(() => {
      useCanvasStore.getState().addShape({
        id: 'text-1',
        type: 'text',
        x: 100,
        y: 100,
        width: 200,
        height: 100,
        rotation: 0,
        text: 'Hello World',
        fontSize: 20,
        color: '#000000',
      })
      useCanvasStore.getState().selectShape('text-1')
    })

    // Verify color picker exists and shows black
    const colorInput = screen.getByTestId('color-picker') as HTMLInputElement
    expect(colorInput.value).toBe('#000000')

    // Change to red
    act(() => {
      fireEvent.change(colorInput, { target: { value: '#ff0000' } })
    })

    // Verify text color updated
    const text = useCanvasStore.getState().shapes.get('text-1')
    expect(text?.color).toBe('#ff0000')
  })
})

