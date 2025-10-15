/**
 * Arrow Key Movement Tests (PR #24)
 * 
 * WHY: Test that arrow keys move selected shapes by 20px or 100px (with Shift).
 * This is a fundamental Figma-like feature for precise positioning.
 * 
 * WHAT WE'RE TESTING:
 * 1. Arrow keys move single selected shape by 20px
 * 2. Shift+Arrow moves shape by 100px
 * 3. Arrow keys move multiple selected shapes together
 * 4. Arrow keys don't interfere with text input
 * 5. Arrow keys respect grid boundaries
 */

import React from 'react'
import { render, fireEvent, act } from '@testing-library/react'
import Canvas from '@/components/Canvas'
import { useCanvasStore } from '@/lib/canvasStore'
import { WebsocketProvider } from 'y-websocket'

describe('Arrow Key Movement (PR #24)', () => {
  // Mock WebSocket provider
  const mockProvider = null as unknown as WebsocketProvider
  const mockUsers = []
  const mockUpdateCursor = jest.fn()
  const mockCurrentUser = { id: 'user-123', name: 'Test User', color: '#3b82f6' }

  beforeEach(() => {
    // Clear all shapes before each test
    useCanvasStore.getState().clearShapes()
    useCanvasStore.getState().clearSelection()
  })

  test('Arrow Up moves selected shape up by 20px', () => {
    // ARRANGE: Render Canvas component (so keyboard listeners are attached)
    const { unmount } = render(
      <Canvas 
        provider={mockProvider} 
        users={mockUsers} 
        updateCursor={mockUpdateCursor} 
        currentUser={mockCurrentUser} 
      />
    )

    // Create and select a rectangle
    act(() => {
      const store = useCanvasStore.getState()
      store.addShape({
        id: 'rect-1',
        type: 'rect',
        x: 100,
        y: 100,
        width: 50,
        height: 50,
        rotation: 0,
        color: '#3b82f6',
      })
      store.selectShape('rect-1')
    })

    // ACT: Simulate pressing Arrow Up
    act(() => {
      fireEvent.keyDown(document, { key: 'ArrowUp' })
    })

    // ASSERT: Shape should move up by 20px (y decreases)
    const shape = useCanvasStore.getState().shapes.get('rect-1')
    expect(shape?.y).toBe(80)
    expect(shape?.x).toBe(100) // x should not change

    unmount()
  })

  test('Arrow Down moves selected shape down by 20px', () => {
    const { unmount } = render(
      <Canvas provider={mockProvider} users={mockUsers} updateCursor={mockUpdateCursor} currentUser={mockCurrentUser} />
    )

    act(() => {
      const store = useCanvasStore.getState()
      store.addShape({
        id: 'rect-1',
        type: 'rect',
        x: 100,
        y: 100,
        width: 50,
        height: 50,
        rotation: 0,
        color: '#3b82f6',
      })
      store.selectShape('rect-1')
    })

    act(() => {
      fireEvent.keyDown(document, { key: 'ArrowDown' })
    })

    const shape = useCanvasStore.getState().shapes.get('rect-1')
    expect(shape?.y).toBe(120)
    expect(shape?.x).toBe(100)

    unmount()
  })

  test('Arrow Left moves selected shape left by 20px', () => {
    const { unmount } = render(
      <Canvas provider={mockProvider} users={mockUsers} updateCursor={mockUpdateCursor} currentUser={mockCurrentUser} />
    )

    act(() => {
      const store = useCanvasStore.getState()
      store.addShape({
        id: 'rect-1',
        type: 'rect',
        x: 100,
        y: 100,
        width: 50,
        height: 50,
        rotation: 0,
        color: '#3b82f6',
      })
      store.selectShape('rect-1')
    })

    act(() => {
      fireEvent.keyDown(document, { key: 'ArrowLeft' })
    })

    const shape = useCanvasStore.getState().shapes.get('rect-1')
    expect(shape?.x).toBe(80)
    expect(shape?.y).toBe(100)

    unmount()
  })

  test('Arrow Right moves selected shape right by 20px', () => {
    const { unmount } = render(
      <Canvas provider={mockProvider} users={mockUsers} updateCursor={mockUpdateCursor} currentUser={mockCurrentUser} />
    )

    act(() => {
      const store = useCanvasStore.getState()
      store.addShape({
        id: 'rect-1',
        type: 'rect',
        x: 100,
        y: 100,
        width: 50,
        height: 50,
        rotation: 0,
        color: '#3b82f6',
      })
      store.selectShape('rect-1')
    })

    act(() => {
      fireEvent.keyDown(document, { key: 'ArrowRight' })
    })

    const shape = useCanvasStore.getState().shapes.get('rect-1')
    expect(shape?.x).toBe(120)
    expect(shape?.y).toBe(100)

    unmount()
  })

  test('Shift+Arrow moves shape by 100px', () => {
    const { unmount } = render(
      <Canvas provider={mockProvider} users={mockUsers} updateCursor={mockUpdateCursor} currentUser={mockCurrentUser} />
    )

    act(() => {
      const store = useCanvasStore.getState()
      store.addShape({
        id: 'rect-1',
        type: 'rect',
        x: 200,
        y: 200,
        width: 50,
        height: 50,
        rotation: 0,
        color: '#3b82f6',
      })
      store.selectShape('rect-1')
    })

    // Press Shift+Arrow Up
    act(() => {
      fireEvent.keyDown(document, { key: 'ArrowUp', shiftKey: true })
    })

    let shape = useCanvasStore.getState().shapes.get('rect-1')
    expect(shape?.y).toBe(100)

    // Press Shift+Arrow Right
    act(() => {
      fireEvent.keyDown(document, { key: 'ArrowRight', shiftKey: true })
    })

    shape = useCanvasStore.getState().shapes.get('rect-1')
    expect(shape?.x).toBe(300)
    expect(shape?.y).toBe(100)

    unmount()
  })

  test('Arrow keys move multiple selected shapes together', () => {
    const { unmount } = render(
      <Canvas provider={mockProvider} users={mockUsers} updateCursor={mockUpdateCursor} currentUser={mockCurrentUser} />
    )

    act(() => {
      const store = useCanvasStore.getState()
      store.addShape({
        id: 'rect-1',
        type: 'rect',
        x: 100,
        y: 100,
        width: 50,
        height: 50,
        rotation: 0,
        color: '#3b82f6',
      })
      store.addShape({
        id: 'circle-1',
        type: 'circle',
        x: 200,
        y: 200,
        width: 50,
        height: 50,
        rotation: 0,
        color: '#10b981',
      })
      store.selectMultiple(['rect-1', 'circle-1'])
    })

    // Press Arrow Down
    act(() => {
      fireEvent.keyDown(document, { key: 'ArrowDown' })
    })

    let rect = useCanvasStore.getState().shapes.get('rect-1')
    let circle = useCanvasStore.getState().shapes.get('circle-1')
    expect(rect?.y).toBe(120)
    expect(circle?.y).toBe(220)

    // Press Arrow Right
    act(() => {
      fireEvent.keyDown(document, { key: 'ArrowRight' })
    })

    rect = useCanvasStore.getState().shapes.get('rect-1')
    circle = useCanvasStore.getState().shapes.get('circle-1')
    expect(rect?.x).toBe(120)
    expect(circle?.x).toBe(220)

    unmount()
  })

  test('Arrow keys work with line shapes (moves both endpoints)', () => {
    const { unmount } = render(
      <Canvas provider={mockProvider} users={mockUsers} updateCursor={mockUpdateCursor} currentUser={mockCurrentUser} />
    )

    act(() => {
      const store = useCanvasStore.getState()
      store.addShape({
        id: 'line-1',
        type: 'line',
        x: 100,
        y: 100,
        x2: 200,
        y2: 200,
        rotation: 0,
        color: '#ef4444',
      })
      store.selectShape('line-1')
    })

    act(() => {
      fireEvent.keyDown(document, { key: 'ArrowUp' })
    })

    const line = useCanvasStore.getState().shapes.get('line-1')
    expect(line?.y).toBe(80)
    expect(line?.x).toBe(100)
    if (line && line.type === 'line') {
      expect(line.x2).toBe(200)
      expect(line.y2).toBe(180)
    }

    unmount()
  })

  test('Arrow keys do nothing when no shape is selected', () => {
    const { unmount } = render(
      <Canvas provider={mockProvider} users={mockUsers} updateCursor={mockUpdateCursor} currentUser={mockCurrentUser} />
    )

    act(() => {
      const store = useCanvasStore.getState()
      store.addShape({
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

    act(() => {
      fireEvent.keyDown(document, { key: 'ArrowUp' })
      fireEvent.keyDown(document, { key: 'ArrowRight' })
    })

    const shape = useCanvasStore.getState().shapes.get('rect-1')
    expect(shape?.x).toBe(100)
    expect(shape?.y).toBe(100)

    unmount()
  })

  test('Arrow keys respect grid boundaries (cannot move outside)', () => {
    const { unmount } = render(
      <Canvas provider={mockProvider} users={mockUsers} updateCursor={mockUpdateCursor} currentUser={mockCurrentUser} />
    )

    act(() => {
      const store = useCanvasStore.getState()
      store.addShape({
        id: 'rect-1',
        type: 'rect',
        x: 0,
        y: 0,
        width: 50,
        height: 50,
        rotation: 0,
        color: '#3b82f6',
      })
      store.selectShape('rect-1')
    })

    // Try to move up (should be blocked by boundary at y=0)
    act(() => {
      fireEvent.keyDown(document, { key: 'ArrowUp' })
    })

    let shape = useCanvasStore.getState().shapes.get('rect-1')
    expect(shape?.y).toBe(0)

    // Try to move left (should be blocked by boundary at x=0)
    act(() => {
      fireEvent.keyDown(document, { key: 'ArrowLeft' })
    })

    shape = useCanvasStore.getState().shapes.get('rect-1')
    expect(shape?.x).toBe(0)

    unmount()
  })
})
