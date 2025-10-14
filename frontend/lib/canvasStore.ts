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
  removeShape: (id: string) => void
  clearShapes: () => void
  
  setViewport: (viewport: ViewportState) => void
  panViewport: (deltaX: number, deltaY: number) => void
  zoomViewport: (delta: number, centerX?: number, centerY?: number) => void
  
  selectShape: (id: string) => void
  deselectShape: (id: string) => void
  clearSelection: () => void
  selectMultiple: (ids: string[]) => void
  toggleSelection: (id: string) => void
  
  setCurrentTool: (tool: Tool) => void
  
  bringToFront: (id: string) => void
  sendToBack: (id: string) => void
  deleteSelected: () => void
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
export const useCanvasStore = create<CanvasStore>((set, get) => ({
  // Initial state
  shapes: new Map(),
  viewport: {
    x: 0,
    y: 0,
    zoom: 1,
  },
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
   */
  panViewport: (deltaX: number, deltaY: number) => {
    set((state) => ({
      viewport: {
        ...state.viewport,
        x: state.viewport.x + deltaX,
        y: state.viewport.y + deltaY,
      },
    }))
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
   */
  zoomViewport: (delta: number, centerX?: number, centerY?: number) => {
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
      
      return {
        viewport: {
          x: newX,
          y: newY,
          zoom: newZoom,
        },
      }
    })
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
   */
  deleteSelected: () => {
    set((state) => {
      if (state.selectedIds.length === 0) return state
      
      const newShapes = new Map(state.shapes)
      state.selectedIds.forEach(id => {
        newShapes.delete(id)
      })
      
      return {
        shapes: newShapes,
        selectedIds: [], // Clear selection after deleting
      }
    })
  },
}))

