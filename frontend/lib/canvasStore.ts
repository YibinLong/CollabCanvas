/**
 * Canvas Store - Zustand State Management
 * 
 * WHY: We need a centralized place to manage canvas state (shapes, viewport).
 * Zustand is a lightweight state management library that's simpler than Redux.
 * 
 * WHAT: This store holds:
 * - shapes: All shapes on the canvas (Map for fast lookups by ID)
 * - viewport: Current pan/zoom state (x, y, zoom)
 * - selectedIds: Which shapes are currently selected
 * 
 * HOW IT WORKS:
 * - Components call useCanvasStore() to access state
 * - Components call store methods (addShape, setViewport, etc.) to update state
 * - When state changes, components automatically re-render
 */

import { create } from 'zustand'
import type { Shape, ViewportState, ShapeType } from '@/types/canvas'

export const BASE_VIEWPORT_WIDTH = 1920
export const BASE_VIEWPORT_HEIGHT = 1080

// Tool type includes 'select' for selection/moving
type Tool = 'select' | ShapeType

/**
 * Canvas Store State Interface
 * 
 * WHY: TypeScript interface ensures we access only valid state properties
 */
interface CanvasStore {
  // State
  shapes: Map<string, Shape>
  viewport: ViewportState
  selectedIds: string[]
  currentTool: Tool
  
  // Actions (methods to update state)
  addShape: (shape: Shape) => void
  updateShape: (id: string, updates: Partial<Shape>) => void
  updateMultipleShapes: (updates: Array<{ id: string; updates: Partial<Shape> }>) => void
  removeShape: (id: string) => void
  clearShapes: () => void
  
  setViewport: (viewport: ViewportState) => void
  panViewport: (deltaX: number, deltaY: number, viewportDims?: { width: number; height: number }) => void
  zoomViewport: (delta: number, centerX?: number, centerY?: number, viewportDims?: { width: number; height: number }) => void
  resetViewport: (zoom?: number, viewportDims?: { width: number; height: number }) => void
  
  selectShape: (id: string) => void
  deselectShape: (id: string) => void
  clearSelection: () => void
  selectMultiple: (ids: string[]) => void
  toggleSelection: (id: string) => void
  
  setCurrentTool: (tool: Tool) => void
  
  bringToFront: (id: string) => void
  sendToBack: (id: string) => void
  deleteSelected: () => void
  
  // Conflict resolution actions
  lockShape: (id: string, userId: string) => void
  unlockShape: (id: string) => void
  isShapeLocked: (id: string, currentUserId: string) => boolean
  releaseAllLocks: (userId: string) => void
  
  // Alignment actions
  alignLeft: () => void
  alignRight: () => void
  alignTop: () => void
  alignBottom: () => void
  distributeHorizontally: () => void
  distributeVertically: () => void
}

/**
 * Create the Zustand store
 * 
 * WHY: create() is Zustand's way of creating a store.
 * The function we pass returns the initial state and actions.
 * 
 * HOW TO USE:
 * const { shapes, addShape } = useCanvasStore()
 */
// Grid boundaries configuration
// WHY: Define a fixed grid size so the canvas has clear boundaries
// WHAT: The grid is 8000x6000 pixels. Users start centered at (4000, 3000)
export const GRID_WIDTH = 8000
export const GRID_HEIGHT = 6000
export const VIEWPORT_PADDING = 300 // How far user can scroll past grid edges
export const DEFAULT_VIEWPORT_ZOOM = 0.6

function computeCenteredViewport(
  zoom: number,
  viewportDims?: { width: number; height: number }
): ViewportState {
  const baseWidth = viewportDims?.width ?? BASE_VIEWPORT_WIDTH
  const baseHeight = viewportDims?.height ?? BASE_VIEWPORT_HEIGHT

  const viewBoxWidth = baseWidth / zoom
  const viewBoxHeight = baseHeight / zoom

  const viewBoxX = (GRID_WIDTH / 2) - (viewBoxWidth / 2)
  const viewBoxY = (GRID_HEIGHT / 2) - (viewBoxHeight / 2)

  return {
    x: -viewBoxX * zoom,
    y: -viewBoxY * zoom,
    zoom,
  }
}

function clampViewportPosition(
  { x, y, zoom }: ViewportState,
  viewportDims?: { width: number; height: number }
): Pick<ViewportState, 'x' | 'y'> {
  const baseWidth = viewportDims?.width ?? BASE_VIEWPORT_WIDTH
  const baseHeight = viewportDims?.height ?? BASE_VIEWPORT_HEIGHT

  const viewBoxWidth = baseWidth / zoom
  const viewBoxHeight = baseHeight / zoom

  const totalWidthWithPadding = GRID_WIDTH + VIEWPORT_PADDING * 2
  const totalHeightWithPadding = GRID_HEIGHT + VIEWPORT_PADDING * 2

  let viewBoxX = -x / zoom
  let viewBoxY = -y / zoom

  if (viewBoxWidth >= totalWidthWithPadding) {
    viewBoxX = (GRID_WIDTH / 2) - (viewBoxWidth / 2)
  } else {
    const minViewBoxX = -VIEWPORT_PADDING
    const maxViewBoxX = GRID_WIDTH + VIEWPORT_PADDING - viewBoxWidth
    viewBoxX = Math.max(minViewBoxX, Math.min(maxViewBoxX, viewBoxX))
  }

  if (viewBoxHeight >= totalHeightWithPadding) {
    viewBoxY = (GRID_HEIGHT / 2) - (viewBoxHeight / 2)
  } else {
    const minViewBoxY = -VIEWPORT_PADDING
    const maxViewBoxY = GRID_HEIGHT + VIEWPORT_PADDING - viewBoxHeight
    viewBoxY = Math.max(minViewBoxY, Math.min(maxViewBoxY, viewBoxY))
  }

  return {
    x: -viewBoxX * zoom,
    y: -viewBoxY * zoom,
  }
}

export const useCanvasStore = create<CanvasStore>((set, get) => ({
  // Initial state
  shapes: new Map(),
  viewport: computeCenteredViewport(DEFAULT_VIEWPORT_ZOOM),
  selectedIds: [],
  currentTool: 'select',
  
  /**
   * Add a new shape to the canvas
   * 
   * WHY: When user creates a shape, we need to add it to our state.
   * Using Map for shapes allows O(1) lookup by ID.
   */
  addShape: (shape: Shape) => {
    set((state) => {
      const newShapes = new Map(state.shapes)
      newShapes.set(shape.id, shape)
      return { shapes: newShapes }
    })
  },
  
  /**
   * Update an existing shape's properties
   * 
   * WHY: When user moves/resizes/rotates a shape, we update it here.
   * Partial<Shape> means we only need to provide the properties we're changing.
   */
  updateShape: (id: string, updates: Partial<Shape>) => {
    set((state) => {
      const shape = state.shapes.get(id)
      if (!shape) return state
      
      const newShapes = new Map(state.shapes)
      newShapes.set(id, { ...shape, ...updates } as Shape)
      return { shapes: newShapes }
    })
  },
  
  /**
   * Update multiple shapes at once (for multi-select move)
   * 
   * WHY: When user has multiple shapes selected and moves them together,
   * we need to update all of them in a single state update for better performance.
   * 
   * HOW: Takes an array of shape IDs and their corresponding updates,
   * applies all updates in one batch to avoid multiple re-renders.
   */
  updateMultipleShapes: (updates: Array<{ id: string; updates: Partial<Shape> }>) => {
    set((state) => {
      const newShapes = new Map(state.shapes)
      let hasChanges = false
      
      updates.forEach(({ id, updates: shapeUpdates }) => {
        const shape = state.shapes.get(id)
        if (shape) {
          newShapes.set(id, { ...shape, ...shapeUpdates } as Shape)
          hasChanges = true
        }
      })
      
      return hasChanges ? { shapes: newShapes } : state
    })
  },
  
  /**
   * Remove a shape from the canvas
   * 
   * WHY: When user deletes a shape, remove it from state.
   */
  removeShape: (id: string) => {
    set((state) => {
      const newShapes = new Map(state.shapes)
      newShapes.delete(id)
      
      // Also remove from selection if selected
      const newSelectedIds = state.selectedIds.filter((selectedId) => selectedId !== id)
      
      return { 
        shapes: newShapes,
        selectedIds: newSelectedIds,
      }
    })
  },
  
  /**
   * Clear all shapes from canvas
   * 
   * WHY: Useful for tests and for clearing the canvas.
   */
  clearShapes: () => {
    set({ shapes: new Map(), selectedIds: [] })
  },
  
  /**
   * Set viewport to specific position and zoom
   * 
   * WHY: Direct control over viewport state (used by pan/zoom handlers).
   */
  setViewport: (viewport: ViewportState) => {
    set({ viewport })
  },
  
  /**
   * Pan the viewport by a delta
   * 
   * WHY: When user drags the canvas, we shift the viewport.
   * Delta is the change in position (not absolute position).
   * 
   * UPDATED: Now constrains viewport to stay within grid boundaries + padding
   * HOW: Calculate new position, then clamp it to allowed range.
   * Special case: When viewport is larger than grid, center the grid in viewport.
   */
  panViewport: (deltaX: number, deltaY: number, viewportDims?: { width: number; height: number }) => {
    set((state) => {
      const proposedViewport: ViewportState = {
        x: state.viewport.x + deltaX,
        y: state.viewport.y + deltaY,
        zoom: state.viewport.zoom,
      }

      const clampedPosition = clampViewportPosition(proposedViewport, viewportDims)

      return {
        viewport: {
          ...state.viewport,
          ...clampedPosition,
        },
      }
    })
  },
  
  /**
   * Zoom the viewport
   * 
   * WHY: When user scrolls mouse wheel, zoom in/out.
   * 
   * HOW: delta is typically the wheel event's deltaY.
   * Negative delta = zoom in, positive delta = zoom out.
   * We clamp zoom between 0.1 and 10 for reasonable limits.
   * 
   * centerX/centerY (optional) allow zooming toward mouse cursor position.
   * 
   * UPDATED: Now constrains viewport to grid boundaries after zooming.
   * Special case: When viewport is larger than grid, center the grid smoothly.
   */
  zoomViewport: (delta: number, centerX?: number, centerY?: number, viewportDims?: { width: number; height: number }) => {
    set((state) => {
      // Calculate new zoom level
      // Dividing by 1000 makes the zoom feel smooth (not too fast)
      const zoomDelta = -delta / 1000
      let newZoom = state.viewport.zoom * (1 + zoomDelta)
      
      // Clamp zoom between 0.1x and 10x
      newZoom = Math.max(0.1, Math.min(10, newZoom))
      
      // If zooming toward a specific point, adjust viewport position
      // so that point stays under the cursor
      let newX = state.viewport.x
      let newY = state.viewport.y
      
      if (centerX !== undefined && centerY !== undefined) {
        // Calculate how much to shift viewport to keep point under cursor
        const zoomRatio = newZoom / state.viewport.zoom
        newX = centerX - (centerX - state.viewport.x) * zoomRatio
        newY = centerY - (centerY - state.viewport.y) * zoomRatio
      }
      
      const clampedPosition = clampViewportPosition(
        {
          x: newX,
          y: newY,
          zoom: newZoom,
        },
        viewportDims
      )

      return {
        viewport: {
          x: clampedPosition.x,
          y: clampedPosition.y,
          zoom: newZoom,
        },
      }
    })
  },

  resetViewport: (zoom: number = DEFAULT_VIEWPORT_ZOOM, viewportDims?: { width: number; height: number }) => {
    set({ viewport: computeCenteredViewport(zoom, viewportDims) })
  },
  
  /**
   * Select a single shape
   * 
   * WHY: When user clicks a shape, mark it as selected.
   * This replaces any previous selection (unless Shift is held, handled elsewhere).
   */
  selectShape: (id: string) => {
    set({ selectedIds: [id] })
  },
  
  /**
   * Deselect a specific shape
   * 
   * WHY: Remove a shape from selection (for Shift+click to toggle).
   */
  deselectShape: (id: string) => {
    set((state) => ({
      selectedIds: state.selectedIds.filter((selectedId) => selectedId !== id),
    }))
  },
  
  /**
   * Clear all selections
   * 
   * WHY: When user clicks empty canvas, deselect everything.
   */
  clearSelection: () => {
    set({ selectedIds: [] })
  },
  
  /**
   * Select multiple shapes at once
   * 
   * WHY: For multi-selection (drag box, Shift+click multiple, etc.)
   */
  selectMultiple: (ids: string[]) => {
    set({ selectedIds: ids })
  },
  
  /**
   * Toggle a shape's selection state (for Shift+click)
   * 
   * WHY: Shift+click should add to selection if not selected,
   * or remove from selection if already selected.
   */
  toggleSelection: (id: string) => {
    set((state) => {
      const isSelected = state.selectedIds.includes(id)
      if (isSelected) {
        // Remove from selection
        return { selectedIds: state.selectedIds.filter(selectedId => selectedId !== id) }
      } else {
        // Add to selection
        return { selectedIds: [...state.selectedIds, id] }
      }
    })
  },
  
  /**
   * Set the current tool
   * 
   * WHY: Users need to switch between tools (select, rect, circle, etc.)
   * The current tool determines what happens when user interacts with canvas.
   */
  setCurrentTool: (tool: Tool) => {
    set({ currentTool: tool })
  },
  
  /**
   * Bring a shape to front (highest zIndex)
   * 
   * WHY: Users need to control layering order when shapes overlap.
   * "Bring to front" makes a shape appear on top of all others.
   * 
   * HOW: Set the shape's zIndex to be higher than all other shapes.
   */
  bringToFront: (id: string) => {
    set((state) => {
      const shape = state.shapes.get(id)
      if (!shape) return state
      
      // Find the current max zIndex
      const allShapes = Array.from(state.shapes.values())
      const maxZIndex = Math.max(0, ...allShapes.map(s => s.zIndex || 0))
      
      // Set this shape's zIndex to max + 1
      const newShapes = new Map(state.shapes)
      newShapes.set(id, { ...shape, zIndex: maxZIndex + 1 })
      
      return { shapes: newShapes }
    })
  },
  
  /**
   * Send a shape to back (lowest zIndex)
   * 
   * WHY: Opposite of bring to front - send a shape behind all others.
   * 
   * HOW: Set the shape's zIndex to be lower than all other shapes.
   */
  sendToBack: (id: string) => {
    set((state) => {
      const shape = state.shapes.get(id)
      if (!shape) return state
      
      // Find the current min zIndex
      const allShapes = Array.from(state.shapes.values())
      const minZIndex = Math.min(0, ...allShapes.map(s => s.zIndex || 0))
      
      // Set this shape's zIndex to min - 1
      const newShapes = new Map(state.shapes)
      newShapes.set(id, { ...shape, zIndex: minZIndex - 1 })
      
      return { shapes: newShapes }
    })
  },
  
  /**
   * Delete all currently selected shapes
   * 
   * WHY: Users need to be able to delete shapes. This is typically
   * triggered by Delete or Backspace key.
   * 
   * HOW: Remove all shapes whose IDs are in selectedIds.
   * NOTE: Won't delete shapes that are locked by other users.
   */
  deleteSelected: () => {
    set((state) => {
      if (state.selectedIds.length === 0) return state
      
      const newShapes = new Map(state.shapes)
      const remainingSelectedIds: string[] = []
      
      state.selectedIds.forEach(id => {
        const shape = state.shapes.get(id)
        // Don't delete if shape is locked (lockedBy exists and is not null)
        if (shape && shape.lockedBy) {
          console.log(`Cannot delete shape ${id} - locked by another user`)
          remainingSelectedIds.push(id)
        } else {
          newShapes.delete(id)
        }
      })
      
      return {
        shapes: newShapes,
        selectedIds: remainingSelectedIds, // Keep locked shapes selected
      }
    })
  },
  
  /**
   * Lock a shape for editing by a specific user
   * 
   * WHY: When a user starts moving or resizing a shape, we "lock" it
   * so other users can't edit it simultaneously. This prevents conflicts
   * where two users try to modify the same shape at the same time.
   * 
   * HOW: Set lockedBy to the user's ID and lockedAt to current timestamp.
   * 
   * @param id - Shape ID to lock
   * @param userId - ID of the user locking the shape
   */
  lockShape: (id: string, userId: string) => {
    set((state) => {
      const shape = state.shapes.get(id)
      if (!shape) return state
      
      const newShapes = new Map(state.shapes)
      newShapes.set(id, { 
        ...shape, 
        lockedBy: userId, 
        lockedAt: Date.now() 
      })
      
      return { shapes: newShapes }
    })
  },
  
  /**
   * Unlock a shape
   * 
   * WHY: When a user finishes moving/resizing, release the lock
   * so other users can now edit it.
   * 
   * HOW: Set lockedBy and lockedAt to null.
   * 
   * @param id - Shape ID to unlock
   */
  unlockShape: (id: string) => {
    set((state) => {
      const shape = state.shapes.get(id)
      if (!shape) return state
      
      const newShapes = new Map(state.shapes)
      newShapes.set(id, { 
        ...shape, 
        lockedBy: null, 
        lockedAt: null 
      })
      
      return { shapes: newShapes }
    })
  },
  
  /**
   * Check if a shape is locked by another user
   * 
   * WHY: Before allowing a user to interact with a shape, check if
   * someone else is currently editing it.
   * 
   * HOW: Return true if lockedBy exists and is NOT the current user.
   * 
   * @param id - Shape ID to check
   * @param currentUserId - ID of the current user
   * @returns true if locked by someone else, false otherwise
   */
  isShapeLocked: (id: string, currentUserId: string) => {
    const shape = get().shapes.get(id)
    if (!shape) return false
    
    // Shape is locked if lockedBy exists and is different from current user
    return !!(shape.lockedBy && shape.lockedBy !== currentUserId)
  },
  
  /**
   * Release all locks held by a specific user
   * 
   * WHY: When a user disconnects or their session ends, we need to
   * release all shapes they had locked. Otherwise those shapes would
   * be permanently locked until timeout.
   * 
   * HOW: Iterate through all shapes and unlock any locked by this user.
   * 
   * @param userId - ID of the user whose locks to release
   */
  releaseAllLocks: (userId: string) => {
    set((state) => {
      const newShapes = new Map(state.shapes)
      let hasChanges = false
      
      state.shapes.forEach((shape, id) => {
        if (shape.lockedBy === userId) {
          newShapes.set(id, {
            ...shape,
            lockedBy: null,
            lockedAt: null,
          })
          hasChanges = true
        }
      })
      
      return hasChanges ? { shapes: newShapes } : state
    })
  },
  
  /**
   * Align all selected shapes to the left (leftmost x)
   * 
   * WHY: Alignment is essential in design tools (Figma-like).
   * Helps users create precise layouts.
   * 
   * HOW: Find the leftmost x among selected shapes, then move
   * all selected shapes to that x position.
   */
  alignLeft: () => {
    set((state) => {
      if (state.selectedIds.length < 2) return state
      
      // Find leftmost x
      const selectedShapes = state.selectedIds
        .map(id => state.shapes.get(id))
        .filter(Boolean) as Shape[]
      
      if (selectedShapes.length === 0) return state
      
      const minX = Math.min(...selectedShapes.map(s => s.x))
      
      // Update all selected shapes to this x
      const updates = state.selectedIds.map(id => ({
        id,
        updates: { x: minX }
      }))
      
      const newShapes = new Map(state.shapes)
      updates.forEach(({ id, updates: shapeUpdates }) => {
        const shape = newShapes.get(id)
        if (shape) {
          newShapes.set(id, { ...shape, ...shapeUpdates } as Shape)
        }
      })
      
      return { shapes: newShapes }
    })
  },
  
  /**
   * Align all selected shapes to the right (rightmost right edge)
   * 
   * WHY: Align right lines up the right edges of shapes.
   * 
   * HOW: Find the rightmost right edge (x + width), then adjust
   * each shape's x so its right edge aligns there.
   */
  alignRight: () => {
    set((state) => {
      if (state.selectedIds.length < 2) return state
      
      const selectedShapes = state.selectedIds
        .map(id => state.shapes.get(id))
        .filter(Boolean) as Shape[]
      
      if (selectedShapes.length === 0) return state
      
      // Find rightmost right edge
      const maxRight = Math.max(...selectedShapes.map(s => {
        if (s.type === 'rect' || s.type === 'circle' || s.type === 'text') {
          return s.x + s.width
        }
        return s.x // Lines and others just use x
      }))
      
      // Update all selected shapes
      const newShapes = new Map(state.shapes)
      state.selectedIds.forEach(id => {
        const shape = newShapes.get(id)
        if (shape) {
          if (shape.type === 'rect' || shape.type === 'circle' || shape.type === 'text') {
            newShapes.set(id, { ...shape, x: maxRight - shape.width } as Shape)
          }
        }
      })
      
      return { shapes: newShapes }
    })
  },
  
  /**
   * Align all selected shapes to the top (topmost y)
   */
  alignTop: () => {
    set((state) => {
      if (state.selectedIds.length < 2) return state
      
      const selectedShapes = state.selectedIds
        .map(id => state.shapes.get(id))
        .filter(Boolean) as Shape[]
      
      if (selectedShapes.length === 0) return state
      
      const minY = Math.min(...selectedShapes.map(s => s.y))
      
      const newShapes = new Map(state.shapes)
      state.selectedIds.forEach(id => {
        const shape = newShapes.get(id)
        if (shape) {
          newShapes.set(id, { ...shape, y: minY } as Shape)
        }
      })
      
      return { shapes: newShapes }
    })
  },
  
  /**
   * Align all selected shapes to the bottom (bottommost bottom edge)
   */
  alignBottom: () => {
    set((state) => {
      if (state.selectedIds.length < 2) return state
      
      const selectedShapes = state.selectedIds
        .map(id => state.shapes.get(id))
        .filter(Boolean) as Shape[]
      
      if (selectedShapes.length === 0) return state
      
      // Find bottommost bottom edge
      const maxBottom = Math.max(...selectedShapes.map(s => {
        if (s.type === 'rect' || s.type === 'circle' || s.type === 'text') {
          return s.y + s.height
        }
        return s.y
      }))
      
      // Update all selected shapes
      const newShapes = new Map(state.shapes)
      state.selectedIds.forEach(id => {
        const shape = newShapes.get(id)
        if (shape) {
          if (shape.type === 'rect' || shape.type === 'circle' || shape.type === 'text') {
            newShapes.set(id, { ...shape, y: maxBottom - shape.height } as Shape)
          }
        }
      })
      
      return { shapes: newShapes }
    })
  },
  
  /**
   * Distribute shapes evenly horizontally
   * 
   * WHY: Creates equal spacing between shapes on the x-axis.
   * 
   * HOW: Sort shapes by x, keep first and last in place,
   * distribute middle shapes evenly in between.
   */
  distributeHorizontally: () => {
    set((state) => {
      if (state.selectedIds.length < 3) return state // Need at least 3 shapes
      
      const selectedShapes = state.selectedIds
        .map(id => ({ id, shape: state.shapes.get(id) }))
        .filter(({ shape }) => shape !== undefined) as Array<{ id: string; shape: Shape }>
      
      if (selectedShapes.length < 3) return state
      
      // Sort by x position
      selectedShapes.sort((a, b) => a.shape.x - b.shape.x)
      
      const first = selectedShapes[0]
      const last = selectedShapes[selectedShapes.length - 1]
      
      // Calculate total span
      const firstRight = first.shape.type === 'rect' || first.shape.type === 'circle' || first.shape.type === 'text'
        ? first.shape.x + first.shape.width
        : first.shape.x
      
      const totalSpan = last.shape.x - firstRight
      
      // Calculate total width of middle shapes
      const middleShapes = selectedShapes.slice(1, -1)
      const totalMiddleWidth = middleShapes.reduce((sum, { shape }) => {
        if (shape.type === 'rect' || shape.type === 'circle' || shape.type === 'text') {
          return sum + shape.width
        }
        return sum
      }, 0)
      
      // Calculate gap
      const gap = (totalSpan - totalMiddleWidth) / (selectedShapes.length - 1)
      
      // Update middle shapes
      const newShapes = new Map(state.shapes)
      let currentX = firstRight + gap
      
      middleShapes.forEach(({ id, shape }) => {
        newShapes.set(id, { ...shape, x: currentX } as Shape)
        if (shape.type === 'rect' || shape.type === 'circle' || shape.type === 'text') {
          currentX += shape.width + gap
        } else {
          currentX += gap
        }
      })
      
      return { shapes: newShapes }
    })
  },
  
  /**
   * Distribute shapes evenly vertically
   */
  distributeVertically: () => {
    set((state) => {
      if (state.selectedIds.length < 3) return state
      
      const selectedShapes = state.selectedIds
        .map(id => ({ id, shape: state.shapes.get(id) }))
        .filter(({ shape }) => shape !== undefined) as Array<{ id: string; shape: Shape }>
      
      if (selectedShapes.length < 3) return state
      
      // Sort by y position
      selectedShapes.sort((a, b) => a.shape.y - b.shape.y)
      
      const first = selectedShapes[0]
      const last = selectedShapes[selectedShapes.length - 1]
      
      // Calculate total span
      const firstBottom = first.shape.type === 'rect' || first.shape.type === 'circle' || first.shape.type === 'text'
        ? first.shape.y + first.shape.height
        : first.shape.y
      
      const totalSpan = last.shape.y - firstBottom
      
      // Calculate total height of middle shapes
      const middleShapes = selectedShapes.slice(1, -1)
      const totalMiddleHeight = middleShapes.reduce((sum, { shape }) => {
        if (shape.type === 'rect' || shape.type === 'circle' || shape.type === 'text') {
          return sum + shape.height
        }
        return sum
      }, 0)
      
      // Calculate gap
      const gap = (totalSpan - totalMiddleHeight) / (selectedShapes.length - 1)
      
      // Update middle shapes
      const newShapes = new Map(state.shapes)
      let currentY = firstBottom + gap
      
      middleShapes.forEach(({ id, shape }) => {
        newShapes.set(id, { ...shape, y: currentY } as Shape)
        if (shape.type === 'rect' || shape.type === 'circle' || shape.type === 'text') {
          currentY += shape.height + gap
        } else {
          currentY += gap
        }
      })
      
      return { shapes: newShapes }
    })
  },
}))

