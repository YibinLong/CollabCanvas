/**
 * Canvas Component - Main Drawing Surface
 * 
 * WHY: This is the core of our design tool - the infinite canvas where users
 * create and manipulate shapes. It handles pan, zoom, shape creation, and manipulation.
 * 
 * WHAT: A large SVG element that:
 * 1. Displays all shapes from the Zustand store
 * 2. Handles pan (drag to move view) and zoom (wheel to zoom)
 * 3. Responds to keyboard shortcuts (Space+drag for pan)
 * 4. Creates shapes based on current tool
 * 5. Allows moving and resizing selected shapes
 * 
 * HOW: 
 * - Uses Zustand store for state management
 * - SVG viewport with viewBox for pan/zoom
 * - Mouse event handlers for interactions
 * - Different interaction modes: pan, create, move, resize
 */

'use client'

import { useEffect, useRef, useState } from 'react'
import { useCanvasStore, GRID_WIDTH, GRID_HEIGHT, BASE_VIEWPORT_WIDTH, BASE_VIEWPORT_HEIGHT, DEFAULT_VIEWPORT_ZOOM } from '@/lib/canvasStore'
import { 
  generateShapeId, 
  calculateMoveUpdates, 
  constrainToGrid, 
  screenToSVG as screenToSVGUtil,
  getShapeCenter,
  duplicateShape,
  calculateRectangularResize
} from '@/lib/canvasUtils'
import { WebsocketProvider } from 'y-websocket'
import type { CurrentUser } from '@/lib/usePresence'
import type { PresenceUser } from './CursorOverlay'
import Rectangle from './shapes/Rectangle'
import Circle from './shapes/Circle'
import Line from './shapes/Line'
import Text from './shapes/Text'
import ResizeHandles, { type HandlePosition } from './ResizeHandles'
import RotationHandle from './RotationHandle'
import CursorOverlay from './CursorOverlay'
import AlignmentToolbar from './AlignmentToolbar'
import PropertiesPanel from './PropertiesPanel'
import ContextMenu from './ContextMenu'
import type { Shape } from '@/types/canvas'

// Interaction modes
type InteractionMode = 'none' | 'panning' | 'creating' | 'moving' | 'resizing' | 'rotating'

/**
 * Canvas Component Props
 * 
 * WHY: Canvas now receives presence data from parent (page.tsx)
 * so that user avatars can be displayed in the header while
 * Canvas still tracks cursor movements.
 * 
 * All props are optional for backward compatibility with tests.
 */
interface CanvasProps {
  provider?: WebsocketProvider | null
  users?: PresenceUser[]
  updateCursor?: (x: number | null, y: number | null) => void
  currentUser?: CurrentUser
}

/**
 * Canvas Component
 */
export default function Canvas({ 
  provider = null, 
  users = [], 
  updateCursor = () => {}, 
  currentUser = { id: 'test-user', name: 'Test User', color: '#3b82f6' } 
}: CanvasProps = {}) {
  const { 
    shapes, 
    viewport, 
    selectedIds, 
    currentTool,
    panViewport, 
    zoomViewport, 
    resetViewport,
    selectShape, 
    selectMultiple,
    clearSelection,
    addShape,
    updateShape,
    updateMultipleShapes,
    toggleSelection,
    deleteSelected,
    removeShape,
    lockShape,
    unlockShape,
    isShapeLocked,
    bringToFront,
    sendToBack,
  } = useCanvasStore()
  
  /**
   * Presence and Collaboration
   * 
   * WHY: Canvas receives presence data as props from parent (page.tsx).
   * This allows user avatars to be displayed in the header while Canvas
   * handles cursor tracking and multiplayer cursors overlay.
   * 
   * WHAT WE RECEIVE:
   * - provider: WebSocket connection for Yjs sync
   * - users: Array of all connected users
   * - updateCursor: Function to broadcast cursor position
   * - currentUser: Info about the logged-in user
   */
  
  // Track if mouse is currently over the canvas
  const [isMouseOverCanvas, setIsMouseOverCanvas] = useState(false)
  
  // Track which text shape is currently being edited
  // WHY: When editing text, we need to remove rotation from handles so they align with the upright text box
  const [editingTextId, setEditingTextId] = useState<string | null>(null)
  
  // Context menu state
  // WHY: Track whether the context menu is open, its position, and which shape it's for
  const [contextMenu, setContextMenu] = useState<{
    isOpen: boolean
    x: number
    y: number
    shapeId: string
  } | null>(null)
  
  // Refs for DOM and interaction state
  const svgRef = useRef<SVGSVGElement>(null)
  const [interactionMode, setInteractionMode] = useState<InteractionMode>('none')
  const [isSpacePressed, setIsSpacePressed] = useState(false)
  
  /**
   * Clipboard for copy/paste functionality
   * 
   * WHY: Store copied shapes in memory (not browser clipboard).
   * This allows us to preserve exact shape properties and supports
   * pasting multiple times from the same copy operation.
   * 
   * WHAT: An array of shapes that were copied.
   * When user presses Cmd+V, we clone these shapes with new IDs and 30px offset.
   */
  const clipboardRef = useRef<Shape[]>([])
  
  // State for tracking interactions
  const interactionStateRef = useRef<{
    startX: number
    startY: number
    lastX: number
    lastY: number
    shapeId?: string
    initialShape?: Shape
    initialShapes?: Map<string, Shape> // For multi-select move
    handlePosition?: HandlePosition
    creatingShapeId?: string
    justFinishedDrag?: boolean
    wasCancelled?: boolean
    initialRotation?: number // For rotation mode - tracks starting rotation angle
  }>({
    startX: 0,
    startY: 0,
    lastX: 0,
    lastY: 0,
    justFinishedDrag: false,
    wasCancelled: false,
  })
  
  /**
   * Convert screen coordinates to SVG coordinates (wrapper for utility function)
   */
  const screenToSVG = (screenX: number, screenY: number): { x: number; y: number } => {
    return screenToSVGUtil(
      screenX,
      screenY,
      svgRef.current,
      viewport,
      clientWidth ?? BASE_VIEWPORT_WIDTH,
      clientHeight ?? BASE_VIEWPORT_HEIGHT
    )
  }
  const [clientWidth, setClientWidth] = useState<number | null>(null)
  const [clientHeight, setClientHeight] = useState<number | null>(null)

  /**
   * Initialize viewport dimensions and centering
   * 
   * WHY: We need to measure the actual available canvas space and center
   * the grid properly within that space, accounting for any padding/offsets.
   * 
   * HOW: Use ResizeObserver to track size changes and update viewport accordingly.
   * This ensures proper centering even when browser window is resized or zoomed.
   */
  useEffect(() => {
    const canvasContainer = svgRef.current?.parentElement
    if (!canvasContainer) return

    const updateDimensions = () => {
      const rect = canvasContainer.getBoundingClientRect()
      setClientWidth(rect.width)
      setClientHeight(rect.height)
      resetViewport(DEFAULT_VIEWPORT_ZOOM, { width: rect.width, height: rect.height })
    }

    // Initial measurement
    updateDimensions()

    // Watch for size changes (window resize, zoom, etc.)
    const resizeObserver = new ResizeObserver(() => {
      updateDimensions()
    })

    resizeObserver.observe(canvasContainer)

    return () => {
      resizeObserver.disconnect()
    }
  }, [resetViewport])
  
  /**
   * Handle mouse down - start interaction
   */
  const handleMouseDown = (e: React.MouseEvent<SVGSVGElement>) => {
    if (e.button !== 0) return // Only left click
    
    // Reset the drag flag when starting a new interaction
    interactionStateRef.current.justFinishedDrag = false
    
    const svgCoords = screenToSVG(e.clientX, e.clientY)
    const target = e.target as HTMLElement
    
    // Check if clicking on empty canvas (not on a shape)
    const isEmptyCanvas = target.tagName === 'svg' || 
      target.tagName === 'SVG' ||
      (target.tagName === 'rect' && target.getAttribute('fill') === 'url(#grid)') ||
      !target.hasAttribute('data-shape-id')
    
    // If space pressed, start panning
    if (isSpacePressed) {
      setInteractionMode('panning')
      interactionStateRef.current = {
        startX: e.clientX,
        startY: e.clientY,
        lastX: e.clientX,
        lastY: e.clientY,
        wasCancelled: false,
      }
      return
    }
    
    // If clicking empty canvas with select tool, start panning
    if (isEmptyCanvas && currentTool === 'select') {
      setInteractionMode('panning')
      interactionStateRef.current = {
        startX: e.clientX,
        startY: e.clientY,
        lastX: e.clientX,
        lastY: e.clientY,
        wasCancelled: false,
      }
      return
    }
    
    // If clicking empty canvas with a shape tool, start creating
    if (isEmptyCanvas && currentTool !== 'select') {
      const shapeId = generateShapeId()
      
      // Constrain initial position to grid boundaries
      const constrainedX = Math.max(0, Math.min(GRID_WIDTH, svgCoords.x))
      const constrainedY = Math.max(0, Math.min(GRID_HEIGHT, svgCoords.y))
      
      setInteractionMode('creating')
      interactionStateRef.current = {
        startX: constrainedX,
        startY: constrainedY,
        lastX: constrainedX,
        lastY: constrainedY,
        creatingShapeId: shapeId,
        wasCancelled: false,
      }
      
      // Create initial shape with minimal size
      const baseShape = {
        id: shapeId,
        x: constrainedX,
        y: constrainedY,
        rotation: 0,
      }
      
      switch (currentTool) {
        case 'rect':
          addShape({ ...baseShape, type: 'rect', width: 1, height: 1, color: '#3b82f6' })
          break
        case 'circle':
          // WHY: Circles now use a bounding box (x, y, width, height) just like rectangles
          // This ensures they can't go out of bounds and makes them behave consistently
          addShape({ ...baseShape, type: 'circle', width: 1, height: 1, color: '#10b981' })
          break
        case 'line':
          // Line x,y is the start point
          addShape({ ...baseShape, type: 'line', x2: constrainedX + 1, y2: constrainedY + 1, color: '#ef4444' })
          break
        case 'text':
          // WHY: Text boxes now work like rectangles - drag to define size
          // Start with minimal size and user drags to expand it
          addShape({ 
            ...baseShape, 
            type: 'text', 
            text: 'Double click to edit', 
            fontSize: 20, 
            color: '#000000',
            width: 1,
            height: 1
          })
          break
      }
      return
    }
  }
  
  /**
   * Handle mouse move - update interaction
   * This can be called from SVG mouse events or from global document mouse events
   */
  const handleMouseMove = (e: React.MouseEvent<SVGSVGElement> | MouseEvent) => {
    const svgCoords = screenToSVG(e.clientX, e.clientY)
    
    // Track cursor position for multiplayer presence (only if mouse is over canvas)
    // Updates every mouse move, but usePresence hook handles throttling internally
    if (isMouseOverCanvas) {
      updateCursor(svgCoords.x, svgCoords.y)
    }
    
    switch (interactionMode) {
      case 'panning':
        const deltaX = e.clientX - interactionStateRef.current.lastX
        const deltaY = e.clientY - interactionStateRef.current.lastY
        panViewport(deltaX, deltaY, {
          width: clientWidth ?? BASE_VIEWPORT_WIDTH,
          height: clientHeight ?? BASE_VIEWPORT_HEIGHT,
        })
        interactionStateRef.current.lastX = e.clientX
        interactionStateRef.current.lastY = e.clientY
        break
        
      case 'creating':
        // Update the shape being created
        const creatingId = interactionStateRef.current.creatingShapeId
        if (!creatingId) break
        
        const shape = shapes.get(creatingId)
        if (!shape) break
        
        const startX = interactionStateRef.current.startX
        const startY = interactionStateRef.current.startY
        
        // Constrain mouse coordinates to grid boundaries while creating
        const constrainedX = Math.max(0, Math.min(GRID_WIDTH, svgCoords.x))
        const constrainedY = Math.max(0, Math.min(GRID_HEIGHT, svgCoords.y))
        
        const width = Math.abs(constrainedX - startX)
        const height = Math.abs(constrainedY - startY)
        const x = Math.min(startX, constrainedX)
        const y = Math.min(startY, constrainedY)
        
        if (shape.type === 'rect') {
          updateShape(creatingId, { x, y, width, height })
        } else if (shape.type === 'circle') {
          // WHY: Circles now use bounding box just like rectangles!
          // User drags from start point to create a box, and circle is inscribed within it
          updateShape(creatingId, { x, y, width, height })
        } else if (shape.type === 'line') {
          updateShape(creatingId, { x2: constrainedX, y2: constrainedY })
        } else if (shape.type === 'text') {
          // WHY: Text boxes work like rectangles when creating
          // User drags from start point to define the text box dimensions
          updateShape(creatingId, { x, y, width, height })
        }
        break
        
      case 'moving':
        // Update position of shapes being moved (can be single or multiple)
        const deltaShapeX = svgCoords.x - interactionStateRef.current.startX
        const deltaShapeY = svgCoords.y - interactionStateRef.current.startY
        
        // If we have multiple shapes (multi-select), move them all together
        if (interactionStateRef.current.initialShapes && interactionStateRef.current.initialShapes.size > 0) {
          const updates: Array<{ id: string; updates: Partial<Shape> }> = []
          
          interactionStateRef.current.initialShapes.forEach((initialShape, shapeId) => {
            // Use helper function to calculate correct updates for each shape type
            const shapeUpdates = calculateMoveUpdates(initialShape, deltaShapeX, deltaShapeY)
            // CONSTRAIN: Apply boundary constraints to keep shape on grid
            const constrainedUpdates = constrainToGrid(shapeUpdates, initialShape, GRID_WIDTH, GRID_HEIGHT)
            updates.push({
              id: shapeId,
              updates: constrainedUpdates
            })
          })
          
          updateMultipleShapes(updates)
        }
        // Single shape move (fallback for compatibility)
        else if (interactionStateRef.current.shapeId && interactionStateRef.current.initialShape) {
          const movingShape = shapes.get(interactionStateRef.current.shapeId)
          if (movingShape) {
            // Use helper function to calculate correct updates for the shape type
            const shapeUpdates = calculateMoveUpdates(interactionStateRef.current.initialShape, deltaShapeX, deltaShapeY)
            // CONSTRAIN: Apply boundary constraints to keep shape on grid
            const constrainedUpdates = constrainToGrid(shapeUpdates, interactionStateRef.current.initialShape, GRID_WIDTH, GRID_HEIGHT)
            updateShape(interactionStateRef.current.shapeId, constrainedUpdates)
          }
        }
        break
        
      case 'resizing':
        // Update size of shape being resized
        if (!interactionStateRef.current.shapeId || !interactionStateRef.current.initialShape) break
        
        const resizingShape = interactionStateRef.current.initialShape
        const handlePos = interactionStateRef.current.handlePosition!
        const dx = svgCoords.x - interactionStateRef.current.startX
        const dy = svgCoords.y - interactionStateRef.current.startY
        
        // Rect, circle, and text all resize the same way (bounding box)
        if (resizingShape.type === 'rect' || resizingShape.type === 'circle' || resizingShape.type === 'text') {
          // Set minimum size based on shape type
          const minWidth = resizingShape.type === 'text' ? 50 : 10
          const minHeight = resizingShape.type === 'text' ? 30 : 10
          
          // Use utility function to calculate resize
          const resizeResult = calculateRectangularResize(
            resizingShape,
            handlePos,
            dx,
            dy,
            minWidth,
            minHeight,
            GRID_WIDTH,
            GRID_HEIGHT
          )
          
          updateShape(interactionStateRef.current.shapeId, resizeResult)
        } else if (resizingShape.type === 'line') {
          // Line resizing: move the start or end point
          // WHY: Lines are defined by two points, so "resizing" means moving either endpoint
          // This is more intuitive than trying to scale the line uniformly
          
          // Constrain coordinates to grid boundaries
          const constrainedX = Math.max(0, Math.min(GRID_WIDTH, svgCoords.x))
          const constrainedY = Math.max(0, Math.min(GRID_HEIGHT, svgCoords.y))
          
          if (handlePos === 'line-start') {
            // Moving the start point (x, y)
            updateShape(interactionStateRef.current.shapeId, {
              x: constrainedX,
              y: constrainedY,
            })
          } else if (handlePos === 'line-end') {
            // Moving the end point (x2, y2)
            updateShape(interactionStateRef.current.shapeId, {
              x2: constrainedX,
              y2: constrainedY,
            })
          }
        }
        break
        
      case 'rotating':
        // Update rotation of shape being rotated
        // WHY: Calculate the angle based on mouse position relative to shape center
        // HOW: Use atan2 to get angles from center to start and current positions,
        // then find the difference and add it to the initial rotation
        
        if (!interactionStateRef.current.shapeId || !interactionStateRef.current.initialShape) break
        
        const rotatingShape = interactionStateRef.current.initialShape
        
        // Calculate the center of the shape (rotation origin)
        const center = getShapeCenter(rotatingShape)
        
        // Calculate angle from center to initial mouse position
        const startAngle = Math.atan2(
          interactionStateRef.current.startY - center.y,
          interactionStateRef.current.startX - center.x
        )
        
        // Calculate angle from center to current mouse position
        const currentAngle = Math.atan2(
          svgCoords.y - center.y,
          svgCoords.x - center.x
        )
        
        // Calculate the rotation delta (in radians) and convert to degrees
        const angleDelta = (currentAngle - startAngle) * (180 / Math.PI)
        
        // Apply the delta to the initial rotation
        const newRotation = (interactionStateRef.current.initialRotation || 0) + angleDelta
        
        // Update the shape's rotation
        updateShape(interactionStateRef.current.shapeId, {
          rotation: newRotation
        })
        break
    }
  }
  
  /**
   * Handle mouse up - end interaction
   * 
   * WHY: When user releases mouse, we need to finish the current operation.
   * We also need to prevent onClick from firing immediately after a drag.
   * ALSO: Release any locks held on shapes.
   */
  const handleMouseUp = () => {
    // WHY: Save the cancelled state BEFORE we reset it, so onClick can check it
    const wasJustCancelled = interactionStateRef.current.wasCancelled
    
    const wasDragging = interactionMode === 'creating' ||
                        interactionMode === 'moving' ||
                        interactionMode === 'resizing' ||
                        interactionMode === 'rotating' ||
                        interactionMode === 'panning'

    if (interactionMode === 'creating') {
      if (interactionStateRef.current.creatingShapeId && !interactionStateRef.current.wasCancelled) {
        const createdShape = shapes.get(interactionStateRef.current.creatingShapeId)

        if (createdShape) {
          if (createdShape.type === 'text') {
            const minWidth = 50
            const minHeight = 30
            const defaultWidth = 200
            const defaultHeight = 100

            if (createdShape.width < minWidth || createdShape.height < minHeight) {
              updateShape(createdShape.id, {
                width: Math.max(createdShape.width, defaultWidth),
                height: Math.max(createdShape.height, defaultHeight),
              })
            }
          } else if (createdShape.type === 'rect') {
            const minWidth = 20
            const minHeight = 20
            const defaultWidth = 100
            const defaultHeight = 100

            if (createdShape.width < minWidth || createdShape.height < minHeight) {
              updateShape(createdShape.id, {
                width: Math.max(createdShape.width, defaultWidth),
                height: Math.max(createdShape.height, defaultHeight),
              })
            }
          } else if (createdShape.type === 'circle') {
            // WHY: Circles now use bounding box, so enforce minimum size like rectangles
            const minWidth = 20
            const minHeight = 20
            const defaultWidth = 100
            const defaultHeight = 100

            if (createdShape.width < minWidth || createdShape.height < minHeight) {
              updateShape(createdShape.id, {
                width: Math.max(createdShape.width, defaultWidth),
                height: Math.max(createdShape.height, defaultHeight),
              })
            }
          } else if (createdShape.type === 'line') {
            const minLength = 20
            const defaultLength = 100

            const dx = createdShape.x2 - createdShape.x
            const dy = createdShape.y2 - createdShape.y
            const length = Math.sqrt(dx * dx + dy * dy)

            if (length < minLength) {
              const angle = Math.atan2(dy, dx)
              const finalAngle = length < 1 ? 0 : angle
              const newX2 = createdShape.x + Math.cos(finalAngle) * defaultLength
              const newY2 = createdShape.y + Math.sin(finalAngle) * defaultLength

              updateShape(createdShape.id, {
                x2: newX2,
                y2: newY2,
              })
            }
          }
        }

        selectShape(interactionStateRef.current.creatingShapeId)
      }
    }
    
    // Release locks when finishing moving, resizing, or rotating
    // WHY: After user finishes interacting with shapes, unlock them
    // so they can be edited by others (in multiplayer) or deleted
    if (interactionMode === 'moving' || interactionMode === 'resizing' || interactionMode === 'rotating') {
      // Unlock all currently selected shapes that were being moved
      if (interactionMode === 'moving' && interactionStateRef.current.initialShapes) {
        // Moving multiple shapes - unlock all of them
        interactionStateRef.current.initialShapes.forEach((shape, id) => {
          unlockShape(id)
        })
      } else if (interactionStateRef.current.shapeId) {
        // Resizing, rotating, or moving single shape - unlock it
        unlockShape(interactionStateRef.current.shapeId)
      }
      
      // Also unlock all selected shapes as a safety measure
      selectedIds.forEach(id => {
        unlockShape(id)
      })
    }

    setInteractionMode('none')
    interactionStateRef.current = {
      startX: 0,
      startY: 0,
      lastX: 0,
      lastY: 0,
      justFinishedDrag: wasDragging || wasJustCancelled, // IMPORTANT: If cancelled, treat it like a drag finished
      wasCancelled: wasJustCancelled, // Keep the cancelled state for onClick to check
    }

    // Clear both flags after a short delay so next interaction works normally
    if (wasDragging || wasJustCancelled) {
      setTimeout(() => {
        interactionStateRef.current.justFinishedDrag = false
        interactionStateRef.current.wasCancelled = false
      }, 50) // Increased delay to ensure onClick has time to check the flag
    }
  }
  
  /**
   * Handle mouse wheel - zoom
   */
  const handleWheel = (e: React.WheelEvent<SVGSVGElement>) => {
    e.preventDefault()
    
    const rect = svgRef.current?.getBoundingClientRect()
    if (rect) {
      const mouseX = e.clientX - rect.left
      const mouseY = e.clientY - rect.top
      zoomViewport(e.deltaY, mouseX, mouseY, {
        width: clientWidth ?? BASE_VIEWPORT_WIDTH,
        height: clientHeight ?? BASE_VIEWPORT_HEIGHT,
      })
    }
  }
  
  /**
   * Handle right-click on shape - show context menu
   * 
   * WHY: Right-click should open a context menu with actions like z-index management.
   * This is standard behavior in design tools (Figma, Adobe, etc.)
   * 
   * HOW: Prevent default browser context menu, store mouse position and shape ID,
   * and show our custom context menu component.
   */
  const handleShapeContextMenu = (shape: Shape, e: React.MouseEvent) => {
    e.preventDefault() // Prevent browser's default context menu
    e.stopPropagation()
    
    // Select the shape if not already selected
    if (!selectedIds.includes(shape.id)) {
      selectShape(shape.id)
    }
    
    // Show context menu at mouse position (screen coordinates)
    setContextMenu({
      isOpen: true,
      x: e.clientX,
      y: e.clientY,
      shapeId: shape.id,
    })
  }
  
  /**
   * Handle shape click - select or start moving
   * 
   * WHY: Clicking shapes should select them. Shift+click adds to selection.
   * 
   * HOW: Check if Shift key is pressed. If yes, toggle selection.
   * If no, select only this shape (replacing current selection).
   */
  const handleShapeClick = (shape: Shape, e: React.MouseEvent) => {
    e.stopPropagation()
    
    // Shift+click toggles selection (for multi-select)
    if (e.shiftKey) {
      toggleSelection(shape.id)
      return
    }
    
    // Regular click selects only this shape
    if (!selectedIds.includes(shape.id)) {
      selectShape(shape.id)
      return
    }
    
    // If already selected and using select tool, clicking again does nothing
    // (moving is handled by mouseDown)
  }
  
  /**
   * Handle resize start
   */
  const handleResizeStart = (shapeId: string, position: HandlePosition, e: React.MouseEvent) => {
    e.stopPropagation()
    
    const shape = shapes.get(shapeId)
    if (!shape) return
    
    // Check if shape is locked by another user
    if (isShapeLocked(shapeId, currentUser.id)) {
      // Shape is locked - silently prevent interaction
      return
    }
    
    // Acquire lock before resizing
    lockShape(shapeId, currentUser.id)
    
    const svgCoords = screenToSVG(e.clientX, e.clientY)
    setInteractionMode('resizing')
    interactionStateRef.current = {
      startX: svgCoords.x,
      startY: svgCoords.y,
      lastX: svgCoords.x,
      lastY: svgCoords.y,
      shapeId,
      initialShape: { ...shape },
      handlePosition: position,
    }
  }
  
  /**
   * Handle rotation start
   * 
   * WHY: When user grabs the rotation handle, we need to enter rotation mode.
   * We track the initial mouse position and the shape's current rotation.
   * 
   * HOW: 
   * - Lock the shape (prevent other users from editing it)
   * - Store initial mouse position in SVG coordinates
   * - Store the shape's current rotation (or 0 if not rotated yet)
   * - Enter 'rotating' interaction mode
   */
  const handleRotationStart = (shapeId: string, e: React.MouseEvent) => {
    e.stopPropagation()
    
    const shape = shapes.get(shapeId)
    if (!shape) return
    
    // Check if shape is locked by another user
    if (isShapeLocked(shapeId, currentUser.id)) {
      // Shape is locked - silently prevent interaction
      return
    }
    
    // Acquire lock before rotating
    lockShape(shapeId, currentUser.id)
    
    const svgCoords = screenToSVG(e.clientX, e.clientY)
    setInteractionMode('rotating')
    interactionStateRef.current = {
      startX: svgCoords.x,
      startY: svgCoords.y,
      lastX: svgCoords.x,
      lastY: svgCoords.y,
      shapeId,
      initialShape: { ...shape },
      initialRotation: shape.rotation || 0, // Store current rotation
    }
  }
  
  /**
   * Add global mouse event listeners when interaction starts
   * 
   * WHY: When dragging shapes or handles, the mouse might move outside
   * the SVG element. We need document-level listeners to continue tracking.
   */
  useEffect(() => {
    if (interactionMode === 'none') return
    
    const handleGlobalMouseMove = (e: MouseEvent) => {
      handleMouseMove(e as any)
    }
    
    const handleGlobalMouseUp = () => {
      handleMouseUp()
    }
    
    document.addEventListener('mousemove', handleGlobalMouseMove)
    document.addEventListener('mouseup', handleGlobalMouseUp)
    
    return () => {
      document.removeEventListener('mousemove', handleGlobalMouseMove)
      document.removeEventListener('mouseup', handleGlobalMouseUp)
    }
  }, [interactionMode])
  
  /**
   * Handle keyboard shortcuts
   * 
   * WHY: Keyboard shortcuts are essential for efficient workflows.
   * Space for pan, Delete/Backspace for deleting shapes, Escape to cancel shape creation.
   * IMPORTANT: Don't interfere with text input in textareas!
   */
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Check if user is currently typing in an input or textarea
      // WHY: We don't want canvas shortcuts to interfere with text editing
      const target = e.target as HTMLElement
      const isTyping = target.tagName === 'INPUT' || target.tagName === 'TEXTAREA'
      
      // Space key for panning (but not when typing!)
      if (e.code === 'Space' && !isSpacePressed && !isTyping) {
        e.preventDefault()
        setIsSpacePressed(true)
        return
      }
      
      // Escape key to cancel shape creation
      // WHY: Users should be able to cancel a shape they're currently creating if they change their mind
      // HOW: When Escape is pressed during shape creation, we remove the in-progress shape and reset state
      if (e.key === 'Escape') {
        // Only cancel if we're actively creating a shape (dragging to define size)
        if (interactionMode === 'creating' && interactionStateRef.current.creatingShapeId) {
          e.preventDefault()
          
          const creatingId = interactionStateRef.current.creatingShapeId
          // WHY: Use useCanvasStore.getState() to get current shapes without depending on the Map in useEffect
          // This prevents event listener thrashing when shapes change
          if (useCanvasStore.getState().shapes.has(creatingId)) {
            removeShape(creatingId)
          }

          setInteractionMode('none')
          interactionStateRef.current = {
            startX: 0,
            startY: 0,
            lastX: 0,
            lastY: 0,
            justFinishedDrag: true,
            creatingShapeId: undefined,
            wasCancelled: true,
          }
        }
        // If not creating but other selections exist, clear selection
        // WHY: Escape is commonly used to deselect in design tools
        else if (!isTyping) {
          clearSelection()
        }
      }
      
      // Delete or Backspace key to delete selected shapes
      if (e.key === 'Delete' || e.key === 'Backspace') {
        // Only delete if not typing in an input
        if (!isTyping) {
          e.preventDefault()
          deleteSelected()
        }
      }
      
      // Duplicate selected shapes (Cmd+D / Ctrl+D)
      // WHY: Duplicate is a fundamental design tool feature (Figma-like)
      // Creates clones of selected shapes with a 20px offset for visibility
      // NOTE: We use getState() to avoid stale closures in the event handler
      if ((e.metaKey || e.ctrlKey) && e.key === 'd' && !isTyping) {
        e.preventDefault()
        
        const currentState = useCanvasStore.getState()
        const currentSelectedIds = currentState.selectedIds
        const currentShapes = currentState.shapes
        
        if (currentSelectedIds.length > 0) {
          const newShapeIds: string[] = []
          
          // Duplicate each selected shape
          currentSelectedIds.forEach(id => {
            const shape = currentShapes.get(id)
            if (!shape) return
            
            // Clone the shape with 20px offset using utility function
            const duplicate = duplicateShape(shape, 20, 20)
            newShapeIds.push(duplicate.id)
            
            addShape(duplicate)
          })
          
          // Auto-select the duplicated shapes (Figma behavior)
          if (newShapeIds.length > 0) {
            if (newShapeIds.length === 1) {
              selectShape(newShapeIds[0])
            } else {
              selectMultiple(newShapeIds)
            }
          }
        }
      }
      
      // Copy selected shapes (Cmd+C / Ctrl+C)
      // WHY: Copy is a fundamental workflow in design tools (Figma-like)
      // Stores selected shapes in clipboard for later pasting
      // NOTE: We use getState() to avoid stale closures in the event handler
      if ((e.metaKey || e.ctrlKey) && e.key === 'c' && !isTyping) {
        e.preventDefault()
        
        const currentState = useCanvasStore.getState()
        const currentSelectedIds = currentState.selectedIds
        const currentShapes = currentState.shapes
        
        if (currentSelectedIds.length > 0) {
          // Copy all selected shapes to clipboard
          clipboardRef.current = currentSelectedIds
            .map(id => currentShapes.get(id))
            .filter(Boolean) as Shape[]
        }
      }
      
      // Paste from clipboard (Cmd+V / Ctrl+V)
      // WHY: Paste completes the copy/paste workflow (Figma-like)
      // Creates new shapes from clipboard with 30px offset for visibility
      // NOTE: We use getState() to avoid stale closures in the event handler
      if ((e.metaKey || e.ctrlKey) && e.key === 'v' && !isTyping) {
        e.preventDefault()
        
        if (clipboardRef.current.length > 0) {
          const newShapeIds: string[] = []
          
          // Paste each shape from clipboard
          clipboardRef.current.forEach(shape => {
            // Clone the shape with 30px offset using utility function
            const pasted = duplicateShape(shape, 30, 30)
            newShapeIds.push(pasted.id)
            
            addShape(pasted)
          })
          
          // Auto-select the pasted shapes (Figma behavior)
          if (newShapeIds.length > 0) {
            if (newShapeIds.length === 1) {
              selectShape(newShapeIds[0])
            } else {
              selectMultiple(newShapeIds)
            }
          }
        }
      }
      
      // Z-index shortcuts: Shift+] = Bring to Front, Shift+[ = Send to Back
      if (!isTyping && e.shiftKey) {
        const currentState = useCanvasStore.getState()
        const currentSelectedIds = currentState.selectedIds
        
        if (currentSelectedIds.length > 0) {
          if (e.key === '}' || e.key === ']') {
            e.preventDefault()
            currentSelectedIds.forEach(id => bringToFront(id))
            return
          }
          
          if (e.key === '{' || e.key === '[') {
            e.preventDefault()
            currentSelectedIds.forEach(id => sendToBack(id))
            return
          }
        }
      }
      
      // Arrow keys to move selected shapes
      // WHY: Arrow keys are essential for precise positioning in design tools (Figma-like)
      // Users can nudge shapes by 20px (normal) or 100px (with Shift) for fine control
      // NOTE: We use getState() to avoid stale closures in the event handler
      const currentState = useCanvasStore.getState()
      const currentSelectedIds = currentState.selectedIds
      const currentShapes = currentState.shapes
      
      if (!isTyping && currentSelectedIds.length > 0) {
        const moveAmount = e.shiftKey ? 100 : 20
        let deltaX = 0
        let deltaY = 0
        
        switch (e.key) {
          case 'ArrowUp':
            e.preventDefault()
            deltaY = -moveAmount
            break
          case 'ArrowDown':
            e.preventDefault()
            deltaY = moveAmount
            break
          case 'ArrowLeft':
            e.preventDefault()
            deltaX = -moveAmount
            break
          case 'ArrowRight':
            e.preventDefault()
            deltaX = moveAmount
            break
        }
        
        // If we detected an arrow key, move the selected shapes
        if (deltaX !== 0 || deltaY !== 0) {
          // Build updates for all selected shapes
          const updates: Array<{ id: string; updates: Partial<Shape> }> = []
          
          currentSelectedIds.forEach(id => {
            const shape = currentShapes.get(id)
            if (!shape) return
            
            // Calculate new position using the same logic as drag-move
            const shapeUpdates = calculateMoveUpdates(shape, deltaX, deltaY)
            
            // Apply grid boundary constraints
            const constrainedUpdates = constrainToGrid(shapeUpdates, shape, GRID_WIDTH, GRID_HEIGHT)
            
            updates.push({ id, updates: constrainedUpdates })
          })
          
          // Apply all updates at once
          if (updates.length > 0) {
            updateMultipleShapes(updates)
          }
        }
      }
    }
    
    const handleKeyUp = (e: KeyboardEvent) => {
      // WHY: Always clear isSpacePressed when Space is released
      // We don't check isTyping here because we need to reset the state
      // even if focus moved to/from a text input while Space was held
      if (e.code === 'Space') {
        e.preventDefault()
        setIsSpacePressed(false)
      }
    }
    
    // WHY: Reset isSpacePressed if window loses focus (user switches tabs/windows while holding Space)
    const handleWindowBlur = () => {
      setIsSpacePressed(false)
    }
    
    document.addEventListener('keydown', handleKeyDown)
    document.addEventListener('keyup', handleKeyUp)
    window.addEventListener('blur', handleWindowBlur)
    
    return () => {
      document.removeEventListener('keydown', handleKeyDown)
      document.removeEventListener('keyup', handleKeyUp)
      window.removeEventListener('blur', handleWindowBlur)
    }
    // WHY: Removed 'shapes' and 'selectedIds' from dependencies to prevent event listener thrashing
    // These change frequently, which would cause the event listeners to be removed and re-added constantly.
    // Now we use useCanvasStore.getState() directly inside the handler to get current values.
  }, [isSpacePressed, deleteSelected, interactionMode, removeShape, clearSelection, bringToFront, sendToBack])
  
  /**
   * Automatic lock timeout mechanism
   * 
   * WHY: If a user's browser crashes or they disconnect while editing a shape,
   * that shape would remain locked forever. We need to automatically release
   * stale locks after a timeout period.
   * 
   * HOW: Every 5 seconds, check all shapes for locks older than 30 seconds.
   * If found, release them automatically.
   */
  useEffect(() => {
    const LOCK_TIMEOUT = 30000 // 30 seconds
    const CHECK_INTERVAL = 5000 // Check every 5 seconds
    
    const interval = setInterval(() => {
      const now = Date.now()
      
      // WHY: Use getState() to get current shapes without depending on the Map in useEffect
      // This prevents the interval from being cleared and recreated every time shapes change
      useCanvasStore.getState().shapes.forEach((shape) => {
        // Only release locks from OTHER users (not our own)
        if (shape.lockedBy && 
            shape.lockedBy !== currentUser.id && 
            shape.lockedAt && 
            (now - shape.lockedAt) > LOCK_TIMEOUT) {
          // Auto-release stale lock
          unlockShape(shape.id)
        }
      })
    }, CHECK_INTERVAL)
    
    return () => clearInterval(interval)
    // WHY: Removed 'shapes' from dependencies to prevent unnecessary interval recreation
    // The interval now uses getState() to always get the latest shapes
  }, [currentUser?.id, unlockShape])
  
  /**
   * Render a single shape
   */
  const renderShape = (shape: Shape) => {
    const isSelected = selectedIds.includes(shape.id)
    const isLockedByOther = isShapeLocked(shape.id, currentUser.id)
    
    const handleClick = (e: React.MouseEvent) => {
      handleShapeClick(shape, e)
    }
    
    const handleShapeMouseDown = (e: React.MouseEvent) => {
      e.stopPropagation()
      
      // If space key is pressed, prioritize panning over shape manipulation
      // WHY: Space+Drag should ALWAYS pan, even when mouse is over a shape
      if (isSpacePressed) {
        setInteractionMode('panning')
        interactionStateRef.current = {
          startX: e.clientX,
          startY: e.clientY,
          lastX: e.clientX,
          lastY: e.clientY,
          wasCancelled: false,
        }
        return
      }
      
      // Check if shape is locked by another user
      if (isShapeLocked(shape.id, currentUser.id)) {
        // Shape is locked - silently prevent interaction
        return
      }
      
      // If shift key is pressed, don't do anything here - let onClick handle multi-select
      // This prevents interfering with the toggle selection logic
      if (e.shiftKey) {
        return
      }
      
      // Get SVG coordinates for starting the move
      const svgCoords = screenToSVG(e.clientX, e.clientY)
      
      // NEW BEHAVIOR: Click on shape immediately starts moving it
      // WHY: More intuitive - no need to click twice (once to select, once to move)
      // The shape will be selected AND moved in one action
      
      // If not selected, select it and start moving just this shape
      if (!isSelected) {
        selectShape(shape.id)
        lockShape(shape.id, currentUser.id)

        setInteractionMode('moving')
        interactionStateRef.current = {
          startX: svgCoords.x,
          startY: svgCoords.y,
          lastX: svgCoords.x,
          lastY: svgCoords.y,
          shapeId: shape.id,
          initialShape: { ...shape },
          wasCancelled: false,
        }
      }
      else if (selectedIds.length > 1) {
        const initialShapesMap = new Map<string, Shape>()

        selectedIds.forEach(id => {
          const selectedShape = shapes.get(id)
          if (selectedShape && !isShapeLocked(id, currentUser.id)) {
            lockShape(id, currentUser.id)
            initialShapesMap.set(id, { ...selectedShape })
          }
        })

        setInteractionMode('moving')
        interactionStateRef.current = {
          startX: svgCoords.x,
          startY: svgCoords.y,
          lastX: svgCoords.x,
          lastY: svgCoords.y,
          initialShapes: initialShapesMap,
          wasCancelled: false,
        }
      }
      else {
        lockShape(shape.id, currentUser.id)

        setInteractionMode('moving')
        interactionStateRef.current = {
          startX: svgCoords.x,
          startY: svgCoords.y,
          lastX: svgCoords.x,
          lastY: svgCoords.y,
          shapeId: shape.id,
          initialShape: { ...shape },
          wasCancelled: false,
        }
      }
    }
    
    let shapeElement: React.ReactNode
    // Add a wrapper with cursor styling for locked shapes
    const wrapperStyle = isLockedByOther ? { cursor: 'not-allowed' } : {}
    
    // Right-click handler for context menu
    const handleContextMenu = (e: React.MouseEvent) => {
      handleShapeContextMenu(shape, e)
    }
    
    switch (shape.type) {
      case 'rect':
        shapeElement = <Rectangle key={shape.id} shape={shape} isSelected={isSelected} onClick={handleClick} onMouseDown={handleShapeMouseDown} onContextMenu={handleContextMenu} />
        break
      case 'circle':
        shapeElement = <Circle key={shape.id} shape={shape} isSelected={isSelected} onClick={handleClick} onMouseDown={handleShapeMouseDown} onContextMenu={handleContextMenu} />
        break
      case 'line':
        shapeElement = <Line key={shape.id} shape={shape} isSelected={isSelected} onClick={handleClick} onMouseDown={handleShapeMouseDown} onContextMenu={handleContextMenu} />
        break
      case 'text':
        shapeElement = (
          <Text 
            key={shape.id} 
            shape={shape} 
            isSelected={isSelected} 
            onClick={handleClick} 
            onMouseDown={handleShapeMouseDown}
            onContextMenu={handleContextMenu}
            onTextChange={(newText) => {
              // Update the text content when user edits it
              updateShape(shape.id, { text: newText })
            }}
            onEditingChange={(isEditing) => {
              // Track when text is being edited
              // WHY: We need to know this so we can adjust handle rotation
              setEditingTextId(isEditing ? shape.id : null)
            }}
          />
        )
        break
      default:
        shapeElement = null
    }
    
    return (
      <g key={shape.id}>
        {shapeElement}
        {isSelected && !isLockedByOther && (
          <>
            {/* Resize handles and rotation handle need to rotate with the shape
                WHY: When shape is rotated, the handles should follow the rotation
                so users can intuitively resize/rotate in the shape's local space
                EXCEPTION: When text is being edited, don't rotate handles because
                the text box itself becomes upright for editing */}
            <g
              transform={
                // Don't rotate handles if this text is being edited
                (shape.rotation && !(shape.type === 'text' && editingTextId === shape.id))
                  ? (() => {
                      // Calculate center point for rotation based on shape type
                      let centerX: number
                      let centerY: number
                      
                      if (shape.type === 'rect') {
                        centerX = shape.x + shape.width / 2
                        centerY = shape.y + shape.height / 2
                      } else if (shape.type === 'circle') {
                        centerX = shape.x + shape.width / 2
                        centerY = shape.y + shape.height / 2
                      } else if (shape.type === 'text') {
                        centerX = shape.x + shape.width / 2
                        centerY = shape.y + shape.height / 2
                      } else {
                        // Line type
                        centerX = (shape.x + shape.x2) / 2
                        centerY = (shape.y + shape.y2) / 2
                      }
                      return `rotate(${shape.rotation} ${centerX} ${centerY})`
                    })()
                  : undefined
              }
            >
              {/* Resize handles - corners and edges for resizing */}
              <ResizeHandles
                shape={shape}
                onResizeStart={(position, e) => handleResizeStart(shape.id, position, e)}
              />
              {/* Rotation handle - appears above the shape for rotation
                  WHY: Only show rotation for rectangles and text boxes
                  Circles look the same at any rotation, and lines are better manipulated by endpoints */}
              {(shape.type === 'rect' || shape.type === 'text') && (
                <RotationHandle
                  shape={shape}
                  onRotationStart={(e) => handleRotationStart(shape.id, e)}
                />
              )}
            </g>
          </>
        )}
        {/* Visual indicator for locked shapes */}
        {isLockedByOther && (
          <g>
            {/* Red dashed border around locked shape */}
            {shape.type === 'rect' && (
              <rect
                x={shape.x - 3}
                y={shape.y - 3}
                width={shape.width + 6}
                height={shape.height + 6}
                fill="none"
                stroke="#ef4444"
                strokeWidth="2"
                strokeDasharray="5,5"
                pointerEvents="none"
              />
            )}
            {shape.type === 'circle' && (
              <rect
                x={shape.x}
                y={shape.y}
                width={shape.width}
                height={shape.height}
                fill="none"
                stroke="#ef4444"
                strokeWidth="2"
                strokeDasharray="5,5"
                pointerEvents="none"
              />
            )}
            {/* Lock icon indicator */}
            <g transform={`translate(${shape.x}, ${shape.y - 25})`}>
              <rect x="0" y="0" width="60" height="20" fill="rgba(239, 68, 68, 0.9)" rx="3" />
              <text x="30" y="14" fill="white" fontSize="12" textAnchor="middle" pointerEvents="none">
                🔒 Locked
              </text>
            </g>
          </g>
        )}
      </g>
    )
  }
  
  // Calculate SVG viewBox
  // WHY: The viewBox determines what portion of the SVG coordinate space is visible
  // We use clientWidth/clientHeight (actual canvas dimensions) divided by zoom
  const actualWidth = clientWidth ?? BASE_VIEWPORT_WIDTH
  const actualHeight = clientHeight ?? BASE_VIEWPORT_HEIGHT
  
  const viewBoxWidth = actualWidth / viewport.zoom
  const viewBoxHeight = actualHeight / viewport.zoom
  const viewBoxX = -viewport.x / viewport.zoom
  const viewBoxY = -viewport.y / viewport.zoom
  
  // Determine cursor style
  let cursorStyle = 'default'
  if (isSpacePressed || interactionMode === 'panning') {
    cursorStyle = 'grab'
  } else if (currentTool !== 'select') {
    cursorStyle = 'crosshair'
  } else if (interactionMode === 'moving') {
    cursorStyle = 'move'
  } else if (interactionMode === 'rotating') {
    // Show grabbing cursor during rotation
    cursorStyle = 'grabbing'
  }
  
  return (
    <div 
      className="w-full h-full overflow-hidden bg-gray-100"
      style={{ cursor: cursorStyle }}
    >
      <svg
        ref={svgRef}
        width="100%"
        height="100%"
        viewBox={`${viewBoxX} ${viewBoxY} ${viewBoxWidth} ${viewBoxHeight}`}
        preserveAspectRatio="xMidYMid meet"
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={() => {
          handleMouseUp()
          // Hide cursor when mouse leaves canvas
          setIsMouseOverCanvas(false)
          updateCursor(null, null)
        }}
        onMouseEnter={() => {
          // Show cursor when mouse enters canvas
          setIsMouseOverCanvas(true)
        }}
        onWheel={handleWheel}
        onClick={(e) => {
          if (interactionStateRef.current.wasCancelled) {
            return
          }

          const target = e.target as HTMLElement
          const isEmptyCanvas = target.tagName === 'svg' ||
            target.tagName === 'SVG' ||
            (target.tagName === 'rect' && target.getAttribute('fill') === 'url(#grid)')

          if (interactionStateRef.current.justFinishedDrag) {
            return
          }

          if (isEmptyCanvas && currentTool === 'select') {
            clearSelection()
          } else if (isEmptyCanvas && currentTool !== 'select' && interactionMode === 'none') {
            // Simple click to create shape with default size
            const svgCoords = screenToSVG(e.clientX, e.clientY)
            
            // Constrain click position to grid boundaries
            const constrainedX = Math.max(0, Math.min(GRID_WIDTH, svgCoords.x))
            const constrainedY = Math.max(0, Math.min(GRID_HEIGHT, svgCoords.y))
            
            const shapeId = generateShapeId()
            
            const baseShape = {
              id: shapeId,
              x: constrainedX,
              y: constrainedY,
              rotation: 0,
            }
            
            switch (currentTool) {
              case 'rect':
                // Ensure rect fits within grid bounds
                const rectWidth = Math.min(100, GRID_WIDTH - constrainedX)
                const rectHeight = Math.min(100, GRID_HEIGHT - constrainedY)
                addShape({ ...baseShape, type: 'rect', width: rectWidth, height: rectHeight, color: '#3b82f6' })
                break
              case 'circle':
                // WHY: Circles now use bounding box - ensure it fits within grid bounds
                const circleWidth = Math.min(100, GRID_WIDTH - constrainedX)
                const circleHeight = Math.min(100, GRID_HEIGHT - constrainedY)
                addShape({ ...baseShape, type: 'circle', width: circleWidth, height: circleHeight, color: '#10b981' })
                break
              case 'line':
                // Constrain line endpoint to grid
                const endX = Math.min(constrainedX + 100, GRID_WIDTH)
                const endY = Math.min(constrainedY + 100, GRID_HEIGHT)
                addShape({ ...baseShape, type: 'line', x2: endX, y2: endY, color: '#ef4444' })
                break
              case 'text':
                // WHY: Text needs width and height to define the editable box area
                // Default to 200x100 which is a comfortable size for typing
                addShape({ 
                  ...baseShape, 
                  type: 'text', 
                  text: 'Double click to edit', 
                  fontSize: 20, 
                  color: '#000000',
                  width: 200,
                  height: 100
                })
                break
            }
            
            // Select the newly created shape
            selectShape(shapeId)
          }
        }}
        className="select-none"
      >
        {/* Grid background 
            WHY: Now renders a fixed-size grid instead of infinite
            WHAT: 
            1. White background fills the entire visible area (out-of-bounds)
            2. Grid pattern applied only to the defined canvas area
            3. Gray border around grid shows the boundary
        */}
        <defs>
          <pattern
            id="grid"
            width="50"
            height="50"
            patternUnits="userSpaceOnUse"
          >
            <path
              d="M 50 0 L 0 0 0 50"
              fill="none"
              stroke="#e0e0e0"
              strokeWidth="1"
            />
          </pattern>
        </defs>
        
        {/* White background (out-of-bounds area) */}
        <rect 
          x={viewBoxX - 1000} 
          y={viewBoxY - 1000} 
          width={viewBoxWidth + 2000} 
          height={viewBoxHeight + 2000} 
          fill="#f5f5f5"
          pointerEvents="none"
        />
        
        {/* Fixed-size grid area (the actual canvas) */}
        <rect 
          x="0" 
          y="0" 
          width={GRID_WIDTH} 
          height={GRID_HEIGHT} 
          fill="white"
        />
        <rect 
          x="0" 
          y="0" 
          width={GRID_WIDTH} 
          height={GRID_HEIGHT} 
          fill="url(#grid)"
        />
        
        {/* Border around grid to show boundaries */}
        <rect 
          x="0" 
          y="0" 
          width={GRID_WIDTH} 
          height={GRID_HEIGHT} 
          fill="none"
          stroke="#999999"
          strokeWidth="2"
          pointerEvents="none"
        />
        
        {/* Render all shapes sorted by zIndex */}
        {Array.from(shapes.values())
          .sort((a, b) => (a.zIndex || 0) - (b.zIndex || 0))
          .map(renderShape)}
      </svg>
      
      {/* Zoom indicator */}
      <div className="absolute bottom-4 right-4 bg-white px-3 py-1 rounded shadow text-sm">
        {Math.round(viewport.zoom * 100)}%
      </div>
      
      {/* Tool indicator */}
      <div className="absolute top-4 left-4 bg-white px-3 py-1 rounded shadow text-sm capitalize">
        {currentTool} Tool
      </div>
      
      {/* Multiplayer cursors overlay */}
      <CursorOverlay 
        users={users} 
        currentUserId={currentUser.id}
        svgRef={svgRef}
        viewport={viewport}
        canvasWidth={clientWidth ?? undefined}
        canvasHeight={clientHeight ?? undefined}
      />
      
      {/* Alignment toolbar - shows when 2+ shapes selected */}
      <AlignmentToolbar />
      
      {/* Properties panel (color picker) - shows when shapes selected */}
      <PropertiesPanel />
      
      {/* Context menu - shows on right-click */}
      {contextMenu && contextMenu.isOpen && (
        <ContextMenu
          x={contextMenu.x}
          y={contextMenu.y}
          shapeId={contextMenu.shapeId}
          onClose={() => setContextMenu(null)}
        />
      )}
    </div>
  )
}
