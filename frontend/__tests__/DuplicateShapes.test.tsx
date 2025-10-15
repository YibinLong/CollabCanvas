/**
 * PR #25: Duplicate Shapes Tests (Cmd+D / Ctrl+D)
 * 
 * WHY: Duplication is a fundamental design tool feature. Users expect Cmd+D
 * to clone selected shapes with a small offset, similar to Figma.
 * 
 * WHAT: These tests define the duplicate behavior:
 * 1. Cmd+D clones selected shape(s) with 20px x/y offset
 * 2. Works with multi-select (duplicates all selected shapes)
 * 3. Auto-selects the duplicated shapes
 * 4. Generates new IDs for duplicates
 * 5. Doesn't interfere with text input
 * 
 * These tests will FAIL initially - that's TDD! We'll make them pass in the implementation.
 */

import { render } from '@testing-library/react'
import '@testing-library/jest-dom'
import { act } from 'react'
import Canvas from '@/components/Canvas'
import { useCanvasStore } from '@/lib/canvasStore'

// Mock WebSocket provider
const mockProvider = null
const mockUsers = []
const mockUpdateCursor = jest.fn()
const mockCurrentUser = { id: 'test-user', name: 'Test User', color: '#3b82f6' }

describe('PR #25: Duplicate Shapes (Cmd+D)', () => {
  beforeEach(() => {
    // Clean state before each test
    act(() => {
      useCanvasStore.getState().clearShapes()
      useCanvasStore.getState().clearSelection()
      useCanvasStore.getState().setCurrentTool('select')
    })
  })

  /**
   * Test 1: Cmd+D duplicates selected shape with 20px offset
   * 
   * WHY: Basic duplicate functionality - clone a shape and offset it
   * so the duplicate is visible and not exactly on top of the original.
   * 
   * WHAT: 
   * 1. Create and select a rectangle at (100, 100)
   * 2. Press Cmd+D (or Ctrl+D on Windows)
   * 3. Verify new shape exists at (120, 120)
   * 4. Verify original shape still exists
   */
  test('Cmd+D duplicates selected rectangle with 20px offset', () => {
    render(
      <Canvas 
        provider={mockProvider}
        users={mockUsers}
        updateCursor={mockUpdateCursor}
        currentUser={mockCurrentUser}
      />
    )

    // Add and select a rectangle
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

    // Verify we have 1 shape
    expect(useCanvasStore.getState().shapes.size).toBe(1)

    // Simulate Cmd+D keypress
    act(() => {
      const event = new KeyboardEvent('keydown', {
        key: 'd',
        metaKey: true, // Cmd on Mac
        bubbles: true,
      })
      document.dispatchEvent(event)
    })

    // Verify we now have 2 shapes
    const shapes = useCanvasStore.getState().shapes
    expect(shapes.size).toBe(2)

    // Find the duplicate (should have different ID)
    const allShapes = Array.from(shapes.values())
    const duplicate = allShapes.find(s => s.id !== 'rect-1')
    expect(duplicate).toBeDefined()

    // Verify duplicate has correct offset
    if (duplicate && duplicate.type === 'rect') {
      expect(duplicate.x).toBe(120) // 100 + 20
      expect(duplicate.y).toBe(120) // 100 + 20
      expect(duplicate.width).toBe(50) // Same size
      expect(duplicate.height).toBe(50)
      expect(duplicate.color).toBe('#3b82f6') // Same color
    }
  })

  /**
   * Test 2: Ctrl+D also works (for Windows/Linux users)
   * 
   * WHY: Cross-platform support - Windows/Linux users use Ctrl instead of Cmd.
   */
  test('Ctrl+D duplicates selected shape (Windows/Linux)', () => {
    render(
      <Canvas 
        provider={mockProvider}
        users={mockUsers}
        updateCursor={mockUpdateCursor}
        currentUser={mockCurrentUser}
      />
    )

    // Add and select a circle
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

    // Simulate Ctrl+D keypress
    act(() => {
      const event = new KeyboardEvent('keydown', {
        key: 'd',
        ctrlKey: true, // Ctrl on Windows/Linux
        bubbles: true,
      })
      document.dispatchEvent(event)
    })

    // Verify duplicate was created
    expect(useCanvasStore.getState().shapes.size).toBe(2)
  })

  /**
   * Test 3: Duplicate works with multi-select
   * 
   * WHY: Users often select multiple shapes and want to duplicate them all at once.
   * All selected shapes should be duplicated together.
   */
  test('Cmd+D duplicates all selected shapes', () => {
    render(
      <Canvas 
        provider={mockProvider}
        users={mockUsers}
        updateCursor={mockUpdateCursor}
        currentUser={mockCurrentUser}
      />
    )

    // Add three shapes and select them all
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
        id: 'circle-1',
        type: 'circle',
        x: 200,
        y: 200,
        width: 60,
        height: 60,
        rotation: 0,
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

    expect(useCanvasStore.getState().shapes.size).toBe(3)

    // Duplicate all
    act(() => {
      const event = new KeyboardEvent('keydown', {
        key: 'd',
        metaKey: true,
        bubbles: true,
      })
      document.dispatchEvent(event)
    })

    // Should now have 6 shapes (3 originals + 3 duplicates)
    expect(useCanvasStore.getState().shapes.size).toBe(6)
  })

  /**
   * Test 4: Duplicated shapes are auto-selected
   * 
   * WHY: After duplicating, users typically want to work with the duplicates.
   * Auto-selecting them makes the workflow smoother (like Figma does).
   */
  test('Duplicated shapes are automatically selected', () => {
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
      })
      useCanvasStore.getState().selectShape('rect-1')
    })

    const originalSelectionLength = useCanvasStore.getState().selectedIds.length
    expect(originalSelectionLength).toBe(1)

    // Duplicate
    act(() => {
      const event = new KeyboardEvent('keydown', {
        key: 'd',
        metaKey: true,
        bubbles: true,
      })
      document.dispatchEvent(event)
    })

    // Verify selection changed to the duplicate
    const selectedIds = useCanvasStore.getState().selectedIds
    expect(selectedIds.length).toBe(1)
    // Selected ID should NOT be the original
    expect(selectedIds[0]).not.toBe('rect-1')
  })

  /**
   * Test 5: Cmd+D doesn't interfere with text input
   * 
   * WHY: When user is typing in a text box or input field, Cmd+D should NOT
   * duplicate shapes. It might be a browser bookmark action or other text action.
   */
  test('Cmd+D ignored when typing in input field', () => {
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
      })
      useCanvasStore.getState().selectShape('rect-1')
    })

    // Create a fake input element and focus it
    const input = document.createElement('input')
    document.body.appendChild(input)
    input.focus()

    // Try to duplicate while focused on input
    act(() => {
      const event = new KeyboardEvent('keydown', {
        key: 'd',
        metaKey: true,
        bubbles: true,
      })
      Object.defineProperty(event, 'target', { value: input, writable: false })
      document.dispatchEvent(event)
    })

    // Should still have only 1 shape (duplication was blocked)
    expect(useCanvasStore.getState().shapes.size).toBe(1)

    // Cleanup
    document.body.removeChild(input)
  })

  /**
   * Test 6: Duplicate handles line shape correctly
   * 
   * WHY: Lines have different properties (x2, y2) than other shapes.
   * Need to verify lines duplicate correctly with offset on both endpoints.
   */
  test('Cmd+D duplicates line with correct endpoint offset', () => {
    render(
      <Canvas 
        provider={mockProvider}
        users={mockUsers}
        updateCursor={mockUpdateCursor}
        currentUser={mockCurrentUser}
      />
    )

    // Add and select a line
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

    // Duplicate
    act(() => {
      const event = new KeyboardEvent('keydown', {
        key: 'd',
        metaKey: true,
        bubbles: true,
      })
      document.dispatchEvent(event)
    })

    // Find the duplicate line
    const shapes = useCanvasStore.getState().shapes
    const duplicate = Array.from(shapes.values()).find(s => s.id !== 'line-1')
    
    expect(duplicate).toBeDefined()
    if (duplicate && duplicate.type === 'line') {
      // Both start and end points should be offset by 20px
      expect(duplicate.x).toBe(120) // 100 + 20
      expect(duplicate.y).toBe(120) // 100 + 20
      expect(duplicate.x2).toBe(220) // 200 + 20
      expect(duplicate.y2).toBe(220) // 200 + 20
    }
  })

  /**
   * Test 7: No duplicate if nothing selected
   * 
   * WHY: Cmd+D should only work when shapes are selected.
   * If nothing is selected, it should do nothing.
   */
  test('Cmd+D does nothing when no shapes selected', () => {
    render(
      <Canvas 
        provider={mockProvider}
        users={mockUsers}
        updateCursor={mockUpdateCursor}
        currentUser={mockCurrentUser}
      />
    )

    // Add shapes but don't select any
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
    })

    expect(useCanvasStore.getState().shapes.size).toBe(1)

    // Try to duplicate with nothing selected
    act(() => {
      const event = new KeyboardEvent('keydown', {
        key: 'd',
        metaKey: true,
        bubbles: true,
      })
      document.dispatchEvent(event)
    })

    // Should still have only 1 shape
    expect(useCanvasStore.getState().shapes.size).toBe(1)
  })
})

