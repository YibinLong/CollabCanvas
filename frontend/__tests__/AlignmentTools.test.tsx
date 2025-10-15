/**
 * PR #28: Alignment Tools Tests
 * 
 * WHY: Alignment is a professional design tool feature (Figma-like).
 * Users need to align and distribute shapes for precise layouts.
 * 
 * WHAT: These tests define alignment behaviors:
 * 1. Align left - all shapes align to leftmost x
 * 2. Align right - all shapes align to rightmost x + width
 * 3. Align top - all shapes align to topmost y
 * 4. Align bottom - all shapes align to bottommost y + height
 * 5. Distribute horizontally - even spacing on x-axis
 * 6. Distribute vertically - even spacing on y-axis
 * 7. Only enabled when 2+ shapes selected
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

describe('PR #28: Alignment Tools', () => {
  beforeEach(() => {
    // Clean state before each test
    act(() => {
      useCanvasStore.getState().clearShapes()
      useCanvasStore.getState().clearSelection()
      useCanvasStore.getState().setCurrentTool('select')
    })
  })

  /**
   * Test 1: Align Left - all shapes align to leftmost x
   * 
   * WHY: Align left is a common operation in design tools.
   * All selected shapes should move so their left edges line up.
   */
  test('Align left moves all shapes to leftmost x position', () => {
    render(
      <Canvas 
        provider={mockProvider}
        users={mockUsers}
        updateCursor={mockUpdateCursor}
        currentUser={mockCurrentUser}
      />
    )

    // Add three rectangles at different x positions
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
        y: 150,
        width: 50,
        height: 50,
        rotation: 0,
      })
      useCanvasStore.getState().addShape({
        id: 'rect-3',
        type: 'rect',
        x: 300,
        y: 200,
        width: 50,
        height: 50,
        rotation: 0,
      })
      useCanvasStore.getState().selectMultiple(['rect-1', 'rect-2', 'rect-3'])
    })

    // Find and click align left button
    const alignLeftBtn = screen.getByTestId('align-left')
    act(() => {
      fireEvent.click(alignLeftBtn)
    })

    // All shapes should now have x = 100 (leftmost)
    const shapes = useCanvasStore.getState().shapes
    expect(shapes.get('rect-1')?.x).toBe(100)
    expect(shapes.get('rect-2')?.x).toBe(100)
    expect(shapes.get('rect-3')?.x).toBe(100)
    // Y positions should remain unchanged
    expect(shapes.get('rect-1')?.y).toBe(100)
    expect(shapes.get('rect-2')?.y).toBe(150)
    expect(shapes.get('rect-3')?.y).toBe(200)
  })

  /**
   * Test 2: Align Right - all shapes align to rightmost right edge
   * 
   * WHY: Align right lines up the right edges of all shapes.
   */
  test('Align right moves all shapes to rightmost position', () => {
    render(
      <Canvas 
        provider={mockProvider}
        users={mockUsers}
        updateCursor={mockUpdateCursor}
        currentUser={mockCurrentUser}
      />
    )

    // Add rectangles at different positions
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
        y: 150,
        width: 50,
        height: 50,
        rotation: 0,
      })
      useCanvasStore.getState().addShape({
        id: 'rect-3',
        type: 'rect',
        x: 300,
        y: 200,
        width: 50,
        height: 50,
        rotation: 0,
      })
      useCanvasStore.getState().selectMultiple(['rect-1', 'rect-2', 'rect-3'])
    })

    // Click align right
    const alignRightBtn = screen.getByTestId('align-right')
    act(() => {
      fireEvent.click(alignRightBtn)
    })

    // All shapes should have their right edge at x = 350 (300 + 50)
    // So x should be 350 - width for each shape
    const shapes = useCanvasStore.getState().shapes
    const rect1 = shapes.get('rect-1')
    const rect2 = shapes.get('rect-2')
    const rect3 = shapes.get('rect-3')
    
    if (rect1 && rect1.type === 'rect') {
      expect(rect1.x + rect1.width).toBe(350)
    }
    if (rect2 && rect2.type === 'rect') {
      expect(rect2.x + rect2.width).toBe(350)
    }
    if (rect3 && rect3.type === 'rect') {
      expect(rect3.x + rect3.width).toBe(350)
    }
  })

  /**
   * Test 3: Align Top - all shapes align to topmost y
   * 
   * WHY: Align top lines up the top edges of all shapes.
   */
  test('Align top moves all shapes to topmost y position', () => {
    render(
      <Canvas 
        provider={mockProvider}
        users={mockUsers}
        updateCursor={mockUpdateCursor}
        currentUser={mockCurrentUser}
      />
    )

    // Add rectangles at different y positions
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
      useCanvasStore.getState().addShape({
        id: 'rect-3',
        type: 'rect',
        x: 300,
        y: 300,
        width: 50,
        height: 50,
        rotation: 0,
      })
      useCanvasStore.getState().selectMultiple(['rect-1', 'rect-2', 'rect-3'])
    })

    // Click align top
    const alignTopBtn = screen.getByTestId('align-top')
    act(() => {
      fireEvent.click(alignTopBtn)
    })

    // All shapes should now have y = 100 (topmost)
    const shapes = useCanvasStore.getState().shapes
    expect(shapes.get('rect-1')?.y).toBe(100)
    expect(shapes.get('rect-2')?.y).toBe(100)
    expect(shapes.get('rect-3')?.y).toBe(100)
    // X positions should remain unchanged
    expect(shapes.get('rect-1')?.x).toBe(100)
    expect(shapes.get('rect-2')?.x).toBe(200)
    expect(shapes.get('rect-3')?.x).toBe(300)
  })

  /**
   * Test 4: Align Bottom - all shapes align to bottommost bottom edge
   * 
   * WHY: Align bottom lines up the bottom edges of all shapes.
   */
  test('Align bottom moves all shapes to bottommost position', () => {
    render(
      <Canvas 
        provider={mockProvider}
        users={mockUsers}
        updateCursor={mockUpdateCursor}
        currentUser={mockCurrentUser}
      />
    )

    // Add rectangles at different y positions
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
      useCanvasStore.getState().addShape({
        id: 'rect-3',
        type: 'rect',
        x: 300,
        y: 300,
        width: 50,
        height: 50,
        rotation: 0,
      })
      useCanvasStore.getState().selectMultiple(['rect-1', 'rect-2', 'rect-3'])
    })

    // Click align bottom
    const alignBottomBtn = screen.getByTestId('align-bottom')
    act(() => {
      fireEvent.click(alignBottomBtn)
    })

    // All shapes should have their bottom edge at y = 350 (300 + 50)
    const shapes = useCanvasStore.getState().shapes
    const rect1 = shapes.get('rect-1')
    const rect2 = shapes.get('rect-2')
    const rect3 = shapes.get('rect-3')
    
    if (rect1 && rect1.type === 'rect') {
      expect(rect1.y + rect1.height).toBe(350)
    }
    if (rect2 && rect2.type === 'rect') {
      expect(rect2.y + rect2.height).toBe(350)
    }
    if (rect3 && rect3.type === 'rect') {
      expect(rect3.y + rect3.height).toBe(350)
    }
  })

  /**
   * Test 5: Distribute Horizontally - even spacing on x-axis
   * 
   * WHY: Distribution creates equal spacing between shapes.
   * Useful for creating consistent layouts.
   */
  test('Distribute horizontally creates even spacing', () => {
    render(
      <Canvas 
        provider={mockProvider}
        users={mockUsers}
        updateCursor={mockUpdateCursor}
        currentUser={mockCurrentUser}
      />
    )

    // Add three rectangles
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
        y: 100,
        width: 50,
        height: 50,
        rotation: 0,
      })
      useCanvasStore.getState().addShape({
        id: 'rect-3',
        type: 'rect',
        x: 400,
        y: 100,
        width: 50,
        height: 50,
        rotation: 0,
      })
      useCanvasStore.getState().selectMultiple(['rect-1', 'rect-2', 'rect-3'])
    })

    // Click distribute horizontally
    const distributeHBtn = screen.getByTestId('distribute-horizontal')
    act(() => {
      fireEvent.click(distributeHBtn)
    })

    // Shapes should be evenly spaced
    // First and last shapes don't move, middle shape(s) get distributed
    const shapes = useCanvasStore.getState().shapes
    expect(shapes.get('rect-1')?.x).toBe(100) // Leftmost stays
    expect(shapes.get('rect-3')?.x).toBe(400) // Rightmost stays
    // Middle shape should be evenly spaced
    // Total span calculation:
    // first right edge: 100 + 50 = 150
    // last left edge: 400
    // Available space: 400 - 150 = 250
    // Middle shape width: 50
    // Gap: (250 - 50) / 2 = 100
    // rect-2 position: 150 + 100 = 250
    expect(shapes.get('rect-2')?.x).toBe(250)
  })

  /**
   * Test 6: Distribute Vertically - even spacing on y-axis
   * 
   * WHY: Same as horizontal but for vertical layouts.
   */
  test('Distribute vertically creates even spacing', () => {
    render(
      <Canvas 
        provider={mockProvider}
        users={mockUsers}
        updateCursor={mockUpdateCursor}
        currentUser={mockCurrentUser}
      />
    )

    // Add three rectangles at different y positions
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
        x: 100,
        y: 200,
        width: 50,
        height: 50,
        rotation: 0,
      })
      useCanvasStore.getState().addShape({
        id: 'rect-3',
        type: 'rect',
        x: 100,
        y: 400,
        width: 50,
        height: 50,
        rotation: 0,
      })
      useCanvasStore.getState().selectMultiple(['rect-1', 'rect-2', 'rect-3'])
    })

    // Click distribute vertically
    const distributeVBtn = screen.getByTestId('distribute-vertical')
    act(() => {
      fireEvent.click(distributeVBtn)
    })

    // Shapes should be evenly spaced vertically
    const shapes = useCanvasStore.getState().shapes
    expect(shapes.get('rect-1')?.y).toBe(100) // Top stays
    expect(shapes.get('rect-3')?.y).toBe(400) // Bottom stays
    // Middle shape should be evenly spaced
    // first bottom edge: 100 + 50 = 150
    // last top edge: 400
    // Available space: 400 - 150 = 250
    // Middle shape height: 50
    // Gap: (250 - 50) / 2 = 100
    // rect-2 position: 150 + 100 = 250
    expect(shapes.get('rect-2')?.y).toBe(250)
  })

  /**
   * Test 7: Alignment buttons only show when 2+ shapes selected
   * 
   * WHY: Alignment only makes sense with multiple shapes.
   * Distribution needs 3+ shapes.
   * UI should hide buttons when not applicable.
   */
  test('Alignment tools only visible when 2+ shapes selected', () => {
    render(
      <Canvas 
        provider={mockProvider}
        users={mockUsers}
        updateCursor={mockUpdateCursor}
        currentUser={mockCurrentUser}
      />
    )

    // Add one shape and select it
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
      useCanvasStore.getState().selectShape('rect-1')
    })

    // Alignment buttons should NOT be visible (need 2+ shapes)
    expect(screen.queryByTestId('align-left')).not.toBeInTheDocument()

    // Add another shape and select both
    act(() => {
      useCanvasStore.getState().addShape({
        id: 'rect-2',
        type: 'rect',
        x: 200,
        y: 200,
        width: 50,
        height: 50,
        rotation: 0,
      })
      useCanvasStore.getState().selectMultiple(['rect-1', 'rect-2'])
    })

    // Now alignment buttons SHOULD be visible (2+ shapes)
    expect(screen.getByTestId('align-left')).toBeInTheDocument()
    // But distribute buttons should NOT be visible (need 3+ shapes)
    expect(screen.queryByTestId('distribute-horizontal')).not.toBeInTheDocument()

    // Add third shape and select all three
    act(() => {
      useCanvasStore.getState().addShape({
        id: 'rect-3',
        type: 'rect',
        x: 300,
        y: 300,
        width: 50,
        height: 50,
        rotation: 0,
      })
      useCanvasStore.getState().selectMultiple(['rect-1', 'rect-2', 'rect-3'])
    })

    // Now distribute buttons SHOULD be visible (3+ shapes)
    expect(screen.getByTestId('distribute-horizontal')).toBeInTheDocument()
  })

  /**
   * Test 8: Alignment works with circles
   * 
   * WHY: Verify alignment works for all shape types, not just rectangles.
   * Circles use bounding box, so alignment should work the same.
   */
  test('Alignment works with circle shapes', () => {
    render(
      <Canvas 
        provider={mockProvider}
        users={mockUsers}
        updateCursor={mockUpdateCursor}
        currentUser={mockCurrentUser}
      />
    )

    // Add circles at different positions
    act(() => {
      useCanvasStore.getState().addShape({
        id: 'circle-1',
        type: 'circle',
        x: 100,
        y: 100,
        width: 60,
        height: 60,
        rotation: 0,
        color: '#10b981',
      })
      useCanvasStore.getState().addShape({
        id: 'circle-2',
        type: 'circle',
        x: 200,
        y: 150,
        width: 60,
        height: 60,
        rotation: 0,
        color: '#10b981',
      })
      useCanvasStore.getState().selectMultiple(['circle-1', 'circle-2'])
    })

    // Align left
    const alignLeftBtn = screen.getByTestId('align-left')
    act(() => {
      fireEvent.click(alignLeftBtn)
    })

    // Both circles should have x = 100
    const shapes = useCanvasStore.getState().shapes
    expect(shapes.get('circle-1')?.x).toBe(100)
    expect(shapes.get('circle-2')?.x).toBe(100)
  })
})

