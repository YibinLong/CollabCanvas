/**
 * Canvas Utility Functions
 * 
 * WHY: These helper functions were extracted from Canvas.tsx to improve code organization.
 * Separating pure utility functions makes the code more testable and reusable.
 * 
 * WHAT: Contains helper functions for:
 * - ID generation
 * - Shape movement calculations
 * - Grid boundary constraints
 * - Coordinate transformations
 */

import type { Shape } from '@/types/canvas'

/**
 * Generate a unique ID for shapes
 * 
 * WHY: Creates unique identifiers for shapes using timestamp + random string.
 * This ensures IDs are unique across sessions and users.
 * 
 * @returns A unique shape ID string
 */
export function generateShapeId(): string {
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
export function calculateMoveUpdates(
  shape: Shape,
  deltaX: number,
  deltaY: number
): Partial<Shape> {
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
 * all points to be within [0, gridWidth] and [0, gridHeight]
 * 
 * @param updates - The proposed updates to the shape
 * @param shape - The current shape (for getting dimensions)
 * @param gridWidth - Maximum X coordinate
 * @param gridHeight - Maximum Y coordinate
 * @returns Constrained updates that keep shape within grid
 */
export function constrainToGrid(
  updates: Partial<Shape>,
  shape: Shape,
  gridWidth: number,
  gridHeight: number
): Partial<Shape> {
  const constrained = { ...updates }
  
  if (shape.type === 'rect' || shape.type === 'circle') {
    const width = shape.width
    const height = shape.height
    
    // Constrain x: left edge must be >= 0, right edge must be <= gridWidth
    if (constrained.x !== undefined) {
      constrained.x = Math.max(0, Math.min(gridWidth - width, constrained.x))
    }
    // Constrain y: top edge must be >= 0, bottom edge must be <= gridHeight
    if (constrained.y !== undefined) {
      constrained.y = Math.max(0, Math.min(gridHeight - height, constrained.y))
    }
  } else if (shape.type === 'line') {
    // For lines, constrain both start (x, y) and end (x2, y2) points
    if (constrained.x !== undefined) {
      constrained.x = Math.max(0, Math.min(gridWidth, constrained.x))
    }
    if (constrained.y !== undefined) {
      constrained.y = Math.max(0, Math.min(gridHeight, constrained.y))
    }
    // TypeScript needs to know these properties exist on line type
    if ('x2' in constrained && constrained.x2 !== undefined) {
      constrained.x2 = Math.max(0, Math.min(gridWidth, constrained.x2))
    }
    if ('y2' in constrained && constrained.y2 !== undefined) {
      constrained.y2 = Math.max(0, Math.min(gridHeight, constrained.y2))
    }
  } else if (shape.type === 'text') {
    // For text, just constrain the position point
    if (constrained.x !== undefined) {
      constrained.x = Math.max(0, Math.min(gridWidth, constrained.x))
    }
    if (constrained.y !== undefined) {
      constrained.y = Math.max(0, Math.min(gridHeight, constrained.y))
    }
  }
  
  return constrained
}

/**
 * Convert screen coordinates to SVG coordinates
 * 
 * WHY: Mouse events give us screen (pixel) coordinates, but we need
 * to convert them to SVG world coordinates considering pan/zoom.
 * 
 * HOW: Uses the actual client dimensions and current viewport state
 * to accurately map screen pixels to SVG coordinate space.
 * 
 * @param screenX - Screen X coordinate from mouse event
 * @param screenY - Screen Y coordinate from mouse event
 * @param svgElement - The SVG element reference
 * @param viewport - Current viewport state (x, y, zoom)
 * @param clientWidth - Actual canvas width in pixels
 * @param clientHeight - Actual canvas height in pixels
 * @returns SVG coordinates {x, y}
 */
export function screenToSVG(
  screenX: number,
  screenY: number,
  svgElement: SVGSVGElement | null,
  viewport: { x: number; y: number; zoom: number },
  clientWidth: number,
  clientHeight: number
): { x: number; y: number } {
  if (!svgElement) {
    return { x: screenX, y: screenY }
  }
  
  const rect = svgElement.getBoundingClientRect()
  const viewBoxWidth = clientWidth / viewport.zoom
  const viewBoxHeight = clientHeight / viewport.zoom
  const viewBoxX = -viewport.x / viewport.zoom
  const viewBoxY = -viewport.y / viewport.zoom
  
  // Guard against invalid dimensions (happens in tests)
  if (!rect.width || !rect.height || rect.width === 0 || rect.height === 0) {
    return { x: screenX, y: screenY }
  }
  
  // Convert screen coords to SVG coords
  const x = viewBoxX + ((screenX - rect.left) / rect.width) * viewBoxWidth
  const y = viewBoxY + ((screenY - rect.top) / rect.height) * viewBoxHeight
  
  return { x, y }
}

/**
 * Calculate the center point of a shape (used for rotation)
 * 
 * WHY: When rotating a shape, we need to know its center point.
 * Different shape types calculate center differently.
 * 
 * @param shape - The shape to calculate center for
 * @returns Center coordinates {x, y}
 */
export function getShapeCenter(shape: Shape): { x: number; y: number } {
  if (shape.type === 'rect' || shape.type === 'circle' || shape.type === 'text') {
    return {
      x: shape.x + shape.width / 2,
      y: shape.y + shape.height / 2,
    }
  } else if (shape.type === 'line') {
    return {
      x: (shape.x + shape.x2) / 2,
      y: (shape.y + shape.y2) / 2,
    }
  }
  
  // TypeScript knows we've covered all shape types, so this should never execute
  // The 'never' type assertion makes this explicit
  const exhaustiveCheck: never = shape
  throw new Error(`Unhandled shape type: ${(exhaustiveCheck as Shape).type}`)
}

/**
 * Create a duplicate of a shape with a new ID and offset position
 * 
 * WHY: Used for both duplicate (Cmd+D) and paste (Cmd+V) operations.
 * Consolidates the logic for cloning shapes.
 * 
 * @param shape - The shape to duplicate
 * @param offsetX - X offset for the duplicate
 * @param offsetY - Y offset for the duplicate
 * @returns New shape with new ID and offset position
 */
export function duplicateShape(
  shape: Shape,
  offsetX: number,
  offsetY: number
): Shape {
  const newId = generateShapeId()
  
  if (shape.type === 'line') {
    // Lines need both endpoints offset
    return {
      ...shape,
      id: newId,
      x: shape.x + offsetX,
      y: shape.y + offsetY,
      x2: shape.x2 + offsetX,
      y2: shape.y2 + offsetY,
      lockedBy: null,
      lockedAt: null,
    }
  } else {
    // Other shapes just offset x, y
    return {
      ...shape,
      id: newId,
      x: shape.x + offsetX,
      y: shape.y + offsetY,
      lockedBy: null,
      lockedAt: null,
    }
  }
}

/**
 * Calculate resize updates for rectangular shapes (rect, circle, text)
 * 
 * WHY: Rect, circle, and text all resize the same way - by adjusting their bounding box.
 * This consolidates the identical resize logic into one function.
 * 
 * @param shape - Current shape state
 * @param handlePos - Which handle is being dragged
 * @param dx - Change in X from drag start
 * @param dy - Change in Y from drag start
 * @param minWidth - Minimum width constraint
 * @param minHeight - Minimum height constraint
 * @param gridWidth - Maximum X coordinate
 * @param gridHeight - Maximum Y coordinate
 * @returns Updated shape properties
 */
export function calculateRectangularResize(
  shape: { x: number; y: number; width: number; height: number },
  handlePos: string,
  dx: number,
  dy: number,
  minWidth: number,
  minHeight: number,
  gridWidth: number,
  gridHeight: number
): { x: number; y: number; width: number; height: number } {
  let newX = shape.x
  let newY = shape.y
  let newWidth = shape.width
  let newHeight = shape.height
  
  // Update based on which handle is being dragged
  if (handlePos.includes('l')) {
    newX = shape.x + dx
    newWidth = shape.width - dx
  }
  if (handlePos.includes('r')) {
    newWidth = shape.width + dx
  }
  if (handlePos.includes('t')) {
    newY = shape.y + dy
    newHeight = shape.height - dy
  }
  if (handlePos.includes('b')) {
    newHeight = shape.height + dy
  }
  
  // Ensure minimum size
  if (newWidth < minWidth) newWidth = minWidth
  if (newHeight < minHeight) newHeight = minHeight
  
  // Constrain to grid boundaries
  newX = Math.max(0, Math.min(gridWidth - newWidth, newX))
  newY = Math.max(0, Math.min(gridHeight - newHeight, newY))
  
  // Adjust width/height if they would exceed grid
  newWidth = Math.min(newWidth, gridWidth - newX)
  newHeight = Math.min(newHeight, gridHeight - newY)
  
  return { x: newX, y: newY, width: newWidth, height: newHeight }
}

