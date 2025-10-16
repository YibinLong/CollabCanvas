/**
 * Rotation Handle Component
 * 
 * WHY: Users need a visual handle to rotate shapes, just like in Figma.
 * The rotation handle appears above the selected shape and can be dragged to rotate.
 * 
 * WHAT: Renders a small circular icon above the shape's top edge.
 * When dragged, it calculates the rotation angle based on mouse position relative to shape center.
 * 
 * HOW: 
 * - Position the handle above the top-center of the shape's bounding box
 * - On mouse down, trigger rotation mode in the parent component
 * - The handle has a line connecting it to the shape for visual feedback
 */

'use client'

import type { Shape } from '@/types/canvas'

interface RotationHandleProps {
  shape: Shape
  onRotationStart: (e: React.MouseEvent) => void
}

/**
 * Get the bounding box of a shape for rotation handle placement
 * 
 * WHY: Different shape types have different ways of defining their bounds.
 * We need a consistent way to find the center and top edge of any shape.
 */
function getShapeBounds(shape: Shape): { x: number; y: number; width: number; height: number } {
  switch (shape.type) {
    case 'rect':
      return { x: shape.x, y: shape.y, width: shape.width, height: shape.height }
    case 'circle':
      // Circles use bounding box (x, y, width, height) just like rectangles
      return { x: shape.x, y: shape.y, width: shape.width, height: shape.height }
    case 'line':
      // For lines, create a bounding box around the line
      const minX = Math.min(shape.x, shape.x2)
      const minY = Math.min(shape.y, shape.y2)
      const maxX = Math.max(shape.x, shape.x2)
      const maxY = Math.max(shape.y, shape.y2)
      return { x: minX, y: minY, width: maxX - minX, height: maxY - minY }
    case 'text':
      // Text shapes have explicit width and height properties
      return { x: shape.x, y: shape.y, width: shape.width, height: shape.height }
    default:
      return { x: 0, y: 0, width: 0, height: 0 }
  }
}

/**
 * RotationHandle Component
 * 
 * @param shape - The shape to rotate
 * @param onRotationStart - Callback when user starts dragging the rotation handle
 * 
 * VISUAL DESIGN:
 * - Small white circle with blue border (matches resize handles style)
 * - Positioned 30 pixels above the top edge of the shape
 * - Thin line connecting handle to shape (visual feedback)
 * - Cursor changes to "grab" to indicate it's draggable
 */
export default function RotationHandle({ shape, onRotationStart }: RotationHandleProps) {
  const bounds = getShapeBounds(shape)
  const handleSize = 16 // Diameter of the rotation handle (increased for better visibility)
  const handleOffset = 25 // Distance above the shape (shorter line for cleaner look)
  
  // Calculate center of the shape (for the connecting line)
  const centerX = bounds.x + bounds.width / 2
  const centerY = bounds.y + bounds.height / 2
  
  // Calculate handle position (above the top edge, centered horizontally)
  const handleX = centerX
  const handleY = bounds.y - handleOffset
  
  return (
    <g data-component="rotation-handle">
      {/* Connecting line from shape top to handle 
          WHY: Provides visual feedback showing the rotation axis */}
      <line
        x1={centerX}
        y1={bounds.y} // Top edge of shape
        x2={handleX}
        y2={handleY}
        stroke="#0066ff"
        strokeWidth={1.5}
        strokeDasharray="4 4" // Dashed line for subtle appearance
        pointerEvents="none" // Don't interfere with handle interaction
      />
      
      {/* Hollow rotation handle - matches resize handle style for consistency
          WHY: White fill with blue border creates a clean, professional look that's 
          consistent with the resize handles elsewhere in the app */}
      <circle
        cx={handleX}
        cy={handleY}
        r={handleSize / 3}
        fill="white" // White fill like resize handles
        stroke="#0066ff" // Blue border for contrast and consistency
        strokeWidth={2}
        style={{ cursor: 'grab' }} // Indicates it's draggable
        onMouseDown={(e) => {
          e.stopPropagation() // Don't trigger shape selection or movement
          onRotationStart(e)
        }}
        data-handle-type="rotation"
      />
    </g>
  )
}

