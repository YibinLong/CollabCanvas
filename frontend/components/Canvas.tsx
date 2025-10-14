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

import { useEffect, useRef, useState, useCallback } from 'react'
import { useCanvasStore, GRID_WIDTH, GRID_HEIGHT, BASE_VIEWPORT_WIDTH, BASE_VIEWPORT_HEIGHT, DEFAULT_VIEWPORT_ZOOM } from '@/lib/canvasStore'
import { WebsocketProvider } from 'y-websocket'
import type { CurrentUser } from '@/lib/usePresence'
import type { PresenceUser } from './CursorOverlay'
import Rectangle from './shapes/Rectangle'
import Circle from './shapes/Circle'
import Line from './shapes/Line'
import Text from './shapes/Text'
import ResizeHandles, { type HandlePosition } from './ResizeHandles'
import CursorOverlay from './CursorOverlay'
import type { Shape } from '@/types/canvas'

// Interaction modes
type InteractionMode = 'none' | 'panning' | 'creating' | 'moving' | 'resizing'

/**
 * Generate a unique ID for shapes
 */
function generateId(): string {
  return `shape-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
}

/**
 * Calculate position updates for moving a shape
 * 
 * WHY: Different shape types need different properties updated when moved.
 * Lines have x, y, x2, y2 (start and end points) so both need to move.
 * Other shapes only have x, y.
 * 
 * @param shape - The shape being moved
 * @param deltaX - How much to move horizontally
 * @param deltaY - How much to move vertically
 * @returns Object with the properties that need to be updated
 */
function calculateMoveUpdates(shape: Shape, deltaX: number, deltaY: number): Partial<Shape> {
  const baseUpdate = {
    x: shape.x + deltaX,
    y: shape.y + deltaY,
  }
  
  // Lines need both start point (x, y) and end point (x2, y2) moved
  if (shape.type === 'line') {
    return {
      ...baseUpdate,
      x2: shape.x2 + deltaX,
      y2: shape.y2 + deltaY,
    }
  }
  
  // Other shapes only need x, y updated
  return baseUpdate
}

/**
 * Constrain shape position to grid boundaries
 * 
 * WHY: Shapes should not be able to move outside the grid boundaries.
 * This ensures shapes stay within the defined canvas area.
 * 
 * HOW: For each shape type, calculate its bounding box and constrain
 * all points to be within [0, GRID_WIDTH] and [0, GRID_HEIGHT]
 * 
 * @param updates - The proposed updates to the shape
 * @param shape - The current shape (for getting dimensions)
 * @returns Constrained updates that keep shape within grid
 */
function constrainToGrid(updates: Partial<Shape>, shape: Shape): Partial<Shape> {
  const constrained = { ...updates }
  
  if (shape.type === 'rect') {
    const width = shape.width
    const height = shape.height
    
    // Constrain x: left edge must be >= 0, right edge must be <= GRID_WIDTH
    if (constrained.x !== undefined) {
      constrained.x = Math.max(0, Math.min(GRID_WIDTH - width, constrained.x))
    }
    // Constrain y: top edge must be >= 0, bottom edge must be <= GRID_HEIGHT
    if (constrained.y !== undefined) {
      constrained.y = Math.max(0, Math.min(GRID_HEIGHT - height, constrained.y))
    }
  } else if (shape.type === 'circle') {
    const radius = shape.radius
    
    // Constrain x: center must be >= radius and <= GRID_WIDTH - radius
    if (constrained.x !== undefined) {
      constrained.x = Math.max(radius, Math.min(GRID_WIDTH - radius, constrained.x))
    }
    // Constrain y: center must be >= radius and <= GRID_HEIGHT - radius
    if (constrained.y !== undefined) {
      constrained.y = Math.max(radius, Math.min(GRID_HEIGHT - radius, constrained.y))
    }
  } else if (shape.type === 'line') {
    // For lines, constrain both start (x, y) and end (x2, y2) points
    if (constrained.x !== undefined) {
      constrained.x = Math.max(0, Math.min(GRID_WIDTH, constrained.x))
    }
    if (constrained.y !== undefined) {
      constrained.y = Math.max(0, Math.min(GRID_HEIGHT, constrained.y))
    }
    // TypeScript needs to know these properties exist on line type
    if ('x2' in constrained && constrained.x2 !== undefined) {
      constrained.x2 = Math.max(0, Math.min(GRID_WIDTH, constrained.x2))
    }
    if ('y2' in constrained && constrained.y2 !== undefined) {
      constrained.y2 = Math.max(0, Math.min(GRID_HEIGHT, constrained.y2))
    }
  } else if (shape.type === 'text') {
    // For text, just constrain the position point
    if (constrained.x !== undefined) {
      constrained.x = Math.max(0, Math.min(GRID_WIDTH, constrained.x))
    }
    if (constrained.y !== undefined) {
      constrained.y = Math.max(0, Math.min(GRID_HEIGHT, constrained.y))
    }
  }
  
  return constrained
}

/**
 * Canvas Component Props
 * 
 * WHY: Canvas now receives presence data from parent (page.tsx)
 * so that user avatars can be displayed in the header while
 * Canvas still tracks cursor movements.
 */
interface CanvasProps {
  provider: WebsocketProvider | null
  users: PresenceUser[]
  updateCursor: (x: number | null, y: number | null) => void
  currentUser: CurrentUser
}

/**
 * Canvas Component
 */
export default function Canvas({ provider, users, updateCursor, currentUser }: CanvasProps) {
  const { 
    shapes, 
    viewport, 
    selectedIds, 
    currentTool,
    panViewport, 
    zoomViewport, 
    resetViewport,
    selectShape, 
    clearSelection,
    addShape,
    updateShape,
    updateMultipleShapes,
    toggleSelection,
    deleteSelected,
    lockShape,
    unlockShape,
    isShapeLocked,
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
  
  // Refs for DOM and interaction state
  const svgRef = useRef<SVGSVGElement>(null)
  const [interactionMode, setInteractionMode] = useState<InteractionMode>('none')
  const [isSpacePressed, setIsSpacePressed] = useState(false)
  
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
  }>({
    startX: 0,
    startY: 0,
    lastX: 0,
    lastY: 0,
    justFinishedDrag: false,
  })
  
  /**
   * Convert screen coordinates to SVG coordinates
   * 
   * WHY: Mouse events give us screen (pixel) coordinates, but we need
   * to convert them to SVG world coordinates considering pan/zoom.
   * 
   * HOW: Uses the actual client dimensions and current viewport state
   * to accurately map screen pixels to SVG coordinate space.
   */
  const screenToSVG = (screenX: number, screenY: number): { x: number; y: number } => {
    if (!svgRef.current) return { x: screenX, y: screenY }
    
    const rect = svgRef.current.getBoundingClientRect()
    const actualWidth = clientWidth ?? BASE_VIEWPORT_WIDTH
    const actualHeight = clientHeight ?? BASE_VIEWPORT_HEIGHT
    
    const viewBoxWidth = actualWidth / viewport.zoom
    const viewBoxHeight = actualHeight / viewport.zoom
    const viewBoxX = -viewport.x / viewport.zoom
    const viewBoxY = -viewport.y / viewport.zoom
    
    // Guard against invalid dimensions (happens in tests)
    if (!rect.width || !rect.height || rect.width === 0 || rect.height === 0) {
      // Fallback: just return screen coords as-is (for test environment)
      return { x: screenX, y: screenY }
    }
    
    // Convert screen coords to SVG coords
    const x = viewBoxX + ((screenX - rect.left) / rect.width) * viewBoxWidth
    const y = viewBoxY + ((screenY - rect.top) / rect.height) * viewBoxHeight
    
    return { x, y }
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
      }
      return
    }
    
    // If clicking empty canvas with a shape tool, start creating
    if (isEmptyCanvas && currentTool !== 'select') {
      const shapeId = generateId()
      
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
          // Circle x,y is the CENTER, so it's correct to use svgCoords directly
          addShape({ ...baseShape, type: 'circle', radius: 1, color: '#10b981' })
          break
        case 'line':
          // Line x,y is the start point
          addShape({ ...baseShape, type: 'line', x2: constrainedX + 1, y2: constrainedY + 1, color: '#ef4444' })
          break
        case 'text':
          addShape({ ...baseShape, type: 'text', text: 'Text', fontSize: 16, color: '#000000' })
          setInteractionMode('none') // Text doesn't need drag
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
          // Circle grows from center point, so center should be midpoint between start and current
          const centerX = (startX + constrainedX) / 2
          const centerY = (startY + constrainedY) / 2
          const radius = Math.sqrt(width * width + height * height) / 2
          updateShape(creatingId, { x: centerX, y: centerY, radius })
        } else if (shape.type === 'line') {
          updateShape(creatingId, { x2: constrainedX, y2: constrainedY })
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
            const constrainedUpdates = constrainToGrid(shapeUpdates, initialShape)
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
            const constrainedUpdates = constrainToGrid(shapeUpdates, interactionStateRef.current.initialShape)
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
        
        if (resizingShape.type === 'rect') {
          let newX = resizingShape.x
          let newY = resizingShape.y
          let newWidth = resizingShape.width
          let newHeight = resizingShape.height
          
          // Update based on which handle is being dragged
          if (handlePos.includes('l')) {
            newX = resizingShape.x + dx
            newWidth = resizingShape.width - dx
          }
          if (handlePos.includes('r')) {
            newWidth = resizingShape.width + dx
          }
          if (handlePos.includes('t')) {
            newY = resizingShape.y + dy
            newHeight = resizingShape.height - dy
          }
          if (handlePos.includes('b')) {
            newHeight = resizingShape.height + dy
          }
          
          // Ensure minimum size
          if (newWidth < 10) newWidth = 10
          if (newHeight < 10) newHeight = 10
          
          // Constrain to grid boundaries
          // WHY: Prevent resizing shapes beyond grid edges
          newX = Math.max(0, Math.min(GRID_WIDTH - newWidth, newX))
          newY = Math.max(0, Math.min(GRID_HEIGHT - newHeight, newY))
          
          // Adjust width/height if they would exceed grid
          newWidth = Math.min(newWidth, GRID_WIDTH - newX)
          newHeight = Math.min(newHeight, GRID_HEIGHT - newY)
          
          updateShape(interactionStateRef.current.shapeId, {
            x: newX,
            y: newY,
            width: newWidth,
            height: newHeight,
          })
        } else if (resizingShape.type === 'circle') {
          // Calculate new radius based on distance from center to current mouse position
          // WHY: This gives consistent, predictable resizing. The circle grows/shrinks
          // based on how far the mouse is from the center, which is intuitive.
          const distanceFromCenter = Math.sqrt(
            Math.pow(svgCoords.x - resizingShape.x, 2) + 
            Math.pow(svgCoords.y - resizingShape.y, 2)
          )
          const newRadius = Math.max(5, distanceFromCenter)
          
          // Constrain circle radius to grid boundaries
          // WHY: Circle center is at (x, y), so radius can't make it exceed grid
          const maxRadius = Math.min(
            resizingShape.x,  // Distance to left edge
            GRID_WIDTH - resizingShape.x,  // Distance to right edge
            resizingShape.y,  // Distance to top edge
            GRID_HEIGHT - resizingShape.y  // Distance to bottom edge
          )
          const constrainedRadius = Math.min(newRadius, maxRadius)
          
          updateShape(interactionStateRef.current.shapeId, { radius: constrainedRadius })
        }
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
    // Track if we just finished any drag operation (creating, moving, resizing, OR panning)
    // WHY: Including 'panning' prevents shape creation after panning with Space key
    const wasDragging = interactionMode === 'creating' || 
                        interactionMode === 'moving' || 
                        interactionMode === 'resizing' ||
                        interactionMode === 'panning'
    
    if (interactionMode === 'creating') {
      // Select the newly created shape
      if (interactionStateRef.current.creatingShapeId) {
        selectShape(interactionStateRef.current.creatingShapeId)
      }
    }
    
    // Release locks if we were moving or resizing
    if (interactionMode === 'moving') {
      // Release locks for all shapes that were being moved
      if (interactionStateRef.current.initialShapes) {
        interactionStateRef.current.initialShapes.forEach((_, shapeId) => {
          unlockShape(shapeId)
        })
      }
      // Or release lock for single shape
      else if (interactionStateRef.current.shapeId) {
        unlockShape(interactionStateRef.current.shapeId)
      }
    }
    
    if (interactionMode === 'resizing' && interactionStateRef.current.shapeId) {
      unlockShape(interactionStateRef.current.shapeId)
    }
    
    setInteractionMode('none')
    interactionStateRef.current = {
      startX: 0,
      startY: 0,
      lastX: 0,
      lastY: 0,
      justFinishedDrag: wasDragging, // Flag to prevent onClick from firing after ANY drag
    }
    
    // Clear the flag after a short delay so next click works normally
    if (wasDragging) {
      setTimeout(() => {
        interactionStateRef.current.justFinishedDrag = false
      }, 10)
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
      console.log(`Shape is currently being edited by another user`)
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
   * Space for pan, Delete/Backspace for deleting shapes.
   */
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Space key for panning
      if (e.code === 'Space' && !isSpacePressed) {
        e.preventDefault()
        setIsSpacePressed(true)
        return
      }
      
      // Delete or Backspace key to delete selected shapes
      if (e.key === 'Delete' || e.key === 'Backspace') {
        // Only delete if not typing in an input
        const target = e.target as HTMLElement
        if (target.tagName !== 'INPUT' && target.tagName !== 'TEXTAREA') {
          e.preventDefault()
          deleteSelected()
        }
      }
    }
    
    const handleKeyUp = (e: KeyboardEvent) => {
      if (e.code === 'Space') {
        e.preventDefault()
        setIsSpacePressed(false)
      }
    }
    
    document.addEventListener('keydown', handleKeyDown)
    document.addEventListener('keyup', handleKeyUp)
    
    return () => {
      document.removeEventListener('keydown', handleKeyDown)
      document.removeEventListener('keyup', handleKeyUp)
    }
  }, [isSpacePressed, deleteSelected])
  
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
      
      shapes.forEach((shape) => {
        // Only release locks from OTHER users (not our own)
        if (shape.lockedBy && 
            shape.lockedBy !== currentUser.id && 
            shape.lockedAt && 
            (now - shape.lockedAt) > LOCK_TIMEOUT) {
          console.log(`Auto-releasing stale lock on shape ${shape.id}`)
          unlockShape(shape.id)
        }
      })
    }, CHECK_INTERVAL)
    
    return () => clearInterval(interval)
  }, [shapes, currentUser.id, unlockShape])
  
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
      
      // Check if shape is locked by another user
      if (isShapeLocked(shape.id, currentUser.id)) {
        // Show a visual indication (could be improved with a toast notification)
        console.log(`Shape is currently being edited by another user`)
        return
      }
      
      // If shift key is pressed, don't do anything here - let onClick handle multi-select
      // This prevents interfering with the toggle selection logic
      if (e.shiftKey) {
        return
      }
      
      // If not selected, select it first
      if (!isSelected) {
        selectShape(shape.id)
        return
      }
      
      // If selected (regardless of tool), start moving
      // WHY: Clicking and dragging an existing shape should move it, even if a creation tool is active.
      // This is more intuitive than creating a new shape on top of an existing one.
      const svgCoords = screenToSVG(e.clientX, e.clientY)
      
      // If multiple shapes are selected, prepare to move all of them together
      if (selectedIds.length > 1) {
        // Acquire locks for all selected shapes
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
        }
      } 
      // Single shape move
      else {
        // Acquire lock before moving
        lockShape(shape.id, currentUser.id)
        
        setInteractionMode('moving')
        interactionStateRef.current = {
          startX: svgCoords.x,
          startY: svgCoords.y,
          lastX: svgCoords.x,
          lastY: svgCoords.y,
          shapeId: shape.id,
          initialShape: { ...shape },
        }
      }
    }
    
    let shapeElement: React.ReactNode
    // Add a wrapper with cursor styling for locked shapes
    const wrapperStyle = isLockedByOther ? { cursor: 'not-allowed' } : {}
    
    switch (shape.type) {
      case 'rect':
        shapeElement = <Rectangle key={shape.id} shape={shape} isSelected={isSelected} onClick={handleClick} onMouseDown={handleShapeMouseDown} />
        break
      case 'circle':
        shapeElement = <Circle key={shape.id} shape={shape} isSelected={isSelected} onClick={handleClick} onMouseDown={handleShapeMouseDown} />
        break
      case 'line':
        shapeElement = <Line key={shape.id} shape={shape} isSelected={isSelected} onClick={handleClick} onMouseDown={handleShapeMouseDown} />
        break
      case 'text':
        shapeElement = <Text key={shape.id} shape={shape} isSelected={isSelected} onClick={handleClick} onMouseDown={handleShapeMouseDown} />
        break
      default:
        shapeElement = null
    }
    
    return (
      <g key={shape.id}>
        {shapeElement}
        {isSelected && !isLockedByOther && (
          <ResizeHandles
            shape={shape}
            onResizeStart={(position, e) => handleResizeStart(shape.id, position, e)}
          />
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
              <circle
                cx={shape.x}
                cy={shape.y}
                r={shape.radius + 3}
                fill="none"
                stroke="#ef4444"
                strokeWidth="2"
                strokeDasharray="5,5"
                pointerEvents="none"
              />
            )}
            {/* Lock icon indicator */}
            <g transform={`translate(${shape.type === 'circle' ? shape.x - shape.radius : shape.x}, ${shape.type === 'circle' ? shape.y - shape.radius - 25 : shape.y - 25})`}>
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
        preserveAspectRatio="none"
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
          const target = e.target as HTMLElement
          const isEmptyCanvas = target.tagName === 'svg' || 
            target.tagName === 'SVG' ||
            (target.tagName === 'rect' && target.getAttribute('fill') === 'url(#grid)')
          
          // Don't create shape if we just finished dragging to create one
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
            
            const shapeId = generateId()
            
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
                // Ensure circle fits within grid bounds
                const maxRadius = Math.min(
                  50,  // Default radius
                  constrainedX,  // Distance to left edge
                  GRID_WIDTH - constrainedX,  // Distance to right edge
                  constrainedY,  // Distance to top edge
                  GRID_HEIGHT - constrainedY  // Distance to bottom edge
                )
                addShape({ ...baseShape, type: 'circle', radius: maxRadius, color: '#10b981' })
                break
              case 'line':
                // Constrain line endpoint to grid
                const endX = Math.min(constrainedX + 100, GRID_WIDTH)
                const endY = Math.min(constrainedY + 100, GRID_HEIGHT)
                addShape({ ...baseShape, type: 'line', x2: endX, y2: endY, color: '#ef4444' })
                break
              case 'text':
                addShape({ ...baseShape, type: 'text', text: 'Text', fontSize: 16, color: '#000000' })
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
    </div>
  )
}
