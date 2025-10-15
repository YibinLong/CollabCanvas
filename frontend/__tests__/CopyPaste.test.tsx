/**
 * PR #26: Copy/Paste Tests (Cmd+C / Cmd+V)
 * 
 * WHY: Copy/paste is a fundamental workflow in design tools (Figma-like).
 * Users expect Cmd+C to copy and Cmd+V to paste with a 30px offset.
 * 
 * WHAT: These tests define the copy/paste behavior:
 * 1. Cmd+C copies selected shape(s) to internal clipboard
 * 2. Cmd+V pastes from clipboard with 30px x/y offset
 * 3. Works with multi-select (copies all selected shapes)
 * 4. Can paste multiple times (clipboard persists)
 * 5. Auto-selects pasted shapes
 * 6. Doesn't interfere with text input
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

describe('PR #26: Copy/Paste (Cmd+C / Cmd+V)', () => {
  beforeEach(() => {
    // Clean state before each test
    act(() => {
      useCanvasStore.getState().clearShapes()
      useCanvasStore.getState().clearSelection()
      useCanvasStore.getState().setCurrentTool('select')
    })
  })

  /**
   * Test 1: Cmd+C copies shape, Cmd+V pastes with 30px offset
   * 
   * WHY: Basic copy/paste workflow - standard in all design tools.
   * The 30px offset makes the pasted shape visible and distinct from original.
   * 
   * WHAT:
   * 1. Create and select a shape at (100, 100)
   * 2. Press Cmd+C to copy
   * 3. Press Cmd+V to paste
   * 4. Verify new shape exists at (130, 130)
   */
  test('Cmd+C copies and Cmd+V pastes rectangle with 30px offset', () => {
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

    expect(useCanvasStore.getState().shapes.size).toBe(1)

    // Copy with Cmd+C
    act(() => {
      const copyEvent = new KeyboardEvent('keydown', {
        key: 'c',
        metaKey: true,
        bubbles: true,
      })
      document.dispatchEvent(copyEvent)
    })

    // Paste with Cmd+V
    act(() => {
      const pasteEvent = new KeyboardEvent('keydown', {
        key: 'v',
        metaKey: true,
        bubbles: true,
      })
      document.dispatchEvent(pasteEvent)
    })

    // Verify paste created a new shape
    expect(useCanvasStore.getState().shapes.size).toBe(2)

    // Find the pasted shape (different ID)
    const shapes = useCanvasStore.getState().shapes
    const pasted = Array.from(shapes.values()).find(s => s.id !== 'rect-1')
    
    expect(pasted).toBeDefined()
    if (pasted && pasted.type === 'rect') {
      expect(pasted.x).toBe(130) // 100 + 30
      expect(pasted.y).toBe(130) // 100 + 30
      expect(pasted.width).toBe(50)
      expect(pasted.height).toBe(50)
      expect(pasted.color).toBe('#3b82f6')
    }
  })

  /**
   * Test 2: Ctrl+C and Ctrl+V work (Windows/Linux)
   * 
   * WHY: Cross-platform support - Windows/Linux users use Ctrl.
   */
  test('Ctrl+C/V works for Windows/Linux users', () => {
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

    // Copy with Ctrl+C
    act(() => {
      const copyEvent = new KeyboardEvent('keydown', {
        key: 'c',
        ctrlKey: true,
        bubbles: true,
      })
      document.dispatchEvent(copyEvent)
    })

    // Paste with Ctrl+V
    act(() => {
      const pasteEvent = new KeyboardEvent('keydown', {
        key: 'v',
        ctrlKey: true,
        bubbles: true,
      })
      document.dispatchEvent(pasteEvent)
    })

    // Verify paste worked
    expect(useCanvasStore.getState().shapes.size).toBe(2)
  })

  /**
   * Test 3: Copy/paste works with multi-select
   * 
   * WHY: Users often select multiple shapes and want to copy them all.
   * Relative positions should be preserved.
   */
  test('Copy/paste works with multiple selected shapes', () => {
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
      useCanvasStore.getState().selectMultiple(['rect-1', 'circle-1', 'line-1'])
    })

    expect(useCanvasStore.getState().shapes.size).toBe(3)

    // Copy all
    act(() => {
      const copyEvent = new KeyboardEvent('keydown', {
        key: 'c',
        metaKey: true,
        bubbles: true,
      })
      document.dispatchEvent(copyEvent)
    })

    // Paste all
    act(() => {
      const pasteEvent = new KeyboardEvent('keydown', {
        key: 'v',
        metaKey: true,
        bubbles: true,
      })
      document.dispatchEvent(pasteEvent)
    })

    // Should have 6 shapes (3 originals + 3 pasted)
    expect(useCanvasStore.getState().shapes.size).toBe(6)
  })

  /**
   * Test 4: Can paste multiple times from same clipboard
   * 
   * WHY: Clipboard should persist - users can paste the same content
   * multiple times without copying again.
   */
  test('Can paste multiple times from clipboard', () => {
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

    // Copy once
    act(() => {
      const copyEvent = new KeyboardEvent('keydown', {
        key: 'c',
        metaKey: true,
        bubbles: true,
      })
      document.dispatchEvent(copyEvent)
    })

    // Paste three times
    act(() => {
      const paste1 = new KeyboardEvent('keydown', {
        key: 'v',
        metaKey: true,
        bubbles: true,
      })
      document.dispatchEvent(paste1)
    })

    act(() => {
      const paste2 = new KeyboardEvent('keydown', {
        key: 'v',
        metaKey: true,
        bubbles: true,
      })
      document.dispatchEvent(paste2)
    })

    act(() => {
      const paste3 = new KeyboardEvent('keydown', {
        key: 'v',
        metaKey: true,
        bubbles: true,
      })
      document.dispatchEvent(paste3)
    })

    // Should have 4 shapes (1 original + 3 pasted)
    expect(useCanvasStore.getState().shapes.size).toBe(4)
  })

  /**
   * Test 5: Pasted shapes are auto-selected
   * 
   * WHY: After pasting, users typically want to work with the pasted shapes.
   * Auto-selecting them improves workflow (Figma behavior).
   */
  test('Pasted shapes are automatically selected', () => {
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

    // Copy and paste
    act(() => {
      const copyEvent = new KeyboardEvent('keydown', {
        key: 'c',
        metaKey: true,
        bubbles: true,
      })
      document.dispatchEvent(copyEvent)
    })

    act(() => {
      const pasteEvent = new KeyboardEvent('keydown', {
        key: 'v',
        metaKey: true,
        bubbles: true,
      })
      document.dispatchEvent(pasteEvent)
    })

    // Verify pasted shape is selected (not the original)
    const selectedIds = useCanvasStore.getState().selectedIds
    expect(selectedIds.length).toBe(1)
    expect(selectedIds[0]).not.toBe('rect-1')
  })

  /**
   * Test 6: Copy/paste handles line shapes correctly
   * 
   * WHY: Lines have x2/y2 properties that need special handling.
   * Both endpoints should be offset when pasted.
   */
  test('Copy/paste line with correct endpoint offset', () => {
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

    // Copy and paste
    act(() => {
      const copyEvent = new KeyboardEvent('keydown', {
        key: 'c',
        metaKey: true,
        bubbles: true,
      })
      document.dispatchEvent(copyEvent)
    })

    act(() => {
      const pasteEvent = new KeyboardEvent('keydown', {
        key: 'v',
        metaKey: true,
        bubbles: true,
      })
      document.dispatchEvent(pasteEvent)
    })

    // Find pasted line
    const shapes = useCanvasStore.getState().shapes
    const pasted = Array.from(shapes.values()).find(s => s.id !== 'line-1')
    
    expect(pasted).toBeDefined()
    if (pasted && pasted.type === 'line') {
      expect(pasted.x).toBe(130) // 100 + 30
      expect(pasted.y).toBe(130) // 100 + 30
      expect(pasted.x2).toBe(230) // 200 + 30
      expect(pasted.y2).toBe(230) // 200 + 30
    }
  })

  /**
   * Test 7: Copy/paste ignored when typing
   * 
   * WHY: When user is in a text input, Cmd+C/V should use browser's
   * native copy/paste, not our shape copy/paste.
   */
  test('Copy/paste ignored when typing in input field', () => {
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

    // Create input and focus it
    const input = document.createElement('input')
    document.body.appendChild(input)
    input.focus()

    // Try to copy while in input
    act(() => {
      const copyEvent = new KeyboardEvent('keydown', {
        key: 'c',
        metaKey: true,
        bubbles: true,
      })
      Object.defineProperty(copyEvent, 'target', { value: input, writable: false })
      document.dispatchEvent(copyEvent)
    })

    // Try to paste while in input
    act(() => {
      const pasteEvent = new KeyboardEvent('keydown', {
        key: 'v',
        metaKey: true,
        bubbles: true,
      })
      Object.defineProperty(pasteEvent, 'target', { value: input, writable: false })
      document.dispatchEvent(pasteEvent)
    })

    // Should still have only 1 shape (copy/paste was blocked)
    expect(useCanvasStore.getState().shapes.size).toBe(1)

    // Cleanup
    document.body.removeChild(input)
  })

  /**
   * Test 8: Paste does nothing if clipboard is empty
   * 
   * WHY: Pasting without copying first should do nothing gracefully.
   */
  test('Paste does nothing when clipboard is empty', () => {
    render(
      <Canvas 
        provider={mockProvider}
        users={mockUsers}
        updateCursor={mockUpdateCursor}
        currentUser={mockCurrentUser}
      />
    )

    // Add a shape but don't copy anything
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

    // Try to paste without copying
    act(() => {
      const pasteEvent = new KeyboardEvent('keydown', {
        key: 'v',
        metaKey: true,
        bubbles: true,
      })
      document.dispatchEvent(pasteEvent)
    })

    // Should still have only 1 shape (paste did nothing)
    expect(useCanvasStore.getState().shapes.size).toBe(1)
  })

  /**
   * Test 9: Copy does nothing if nothing selected
   * 
   * WHY: Copy should only work when shapes are selected.
   */
  test('Copy does nothing when no shapes selected', () => {
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

    // Try to copy with nothing selected
    act(() => {
      const copyEvent = new KeyboardEvent('keydown', {
        key: 'c',
        metaKey: true,
        bubbles: true,
      })
      document.dispatchEvent(copyEvent)
    })

    // Try to paste (should do nothing because clipboard is empty)
    act(() => {
      const pasteEvent = new KeyboardEvent('keydown', {
        key: 'v',
        metaKey: true,
        bubbles: true,
      })
      document.dispatchEvent(pasteEvent)
    })

    // Should still have only 1 shape
    expect(useCanvasStore.getState().shapes.size).toBe(1)
  })
})

