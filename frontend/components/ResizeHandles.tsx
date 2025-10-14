/**
 * Resize Handles Component
 * 
 * WHY: When a shape is selected, users need visual handles to resize it.
 * These handles appear at corners and edges of the selected shape.
 * 
 * WHAT: Renders 8 small circles/squares:
 * - 4 corner handles (resize both width and height)
 * - 4 edge handles (resize width OR height)
 * 
 * HOW: Each handle has a mouseDown handler that triggers resize mode.
 * The parent component handles the actual resize logic.
 */

'use client'

import type { Shape } from '@/types/canvas'

interface ResizeHandlesProps {
  shape: Shape
  onResizeStart: (position: HandlePosition, e: React.MouseEvent) => void
}

// Handle positions: corners and edges
export type HandlePosition = 'tl' | 't' | 'tr' | 'r' | 'br' | 'b' | 'bl' | 'l'

/**
 * Get the bounding box of a shape for handle placement
 * 
 * WHY: Different shape types have different ways of defining their bounds.
 * Rectangles use x, y, width, height. Circles use x, y (center) and radius.
 */
function getShapeBounds(shape: Shape): { x: number; y: number; width: number; height: number } {
  switch (shape.type) {
    case 'rect':
      return { x: shape.x, y: shape.y, width: shape.width, height: shape.height }
    case 'circle':
      return {
        x: shape.x - shape.radius,
        y: shape.y - shape.radius,
        width: shape.radius * 2,
        height: shape.radius * 2,
      }
    case 'line':
      // For lines, create a bounding box around the line
      const minX = Math.min(shape.x, shape.x2)
      const minY = Math.min(shape.y, shape.y2)
      const maxX = Math.max(shape.x, shape.x2)
      const maxY = Math.max(shape.y, shape.y2)
      return { x: minX, y: minY, width: maxX - minX, height: maxY - minY }
    case 'text':
      // For text, estimate bounds (in real app, we'd measure rendered text)
      const fontSize = shape.fontSize || 16
      const estimatedWidth = shape.text.length * fontSize * 0.6
      return { x: shape.x, y: shape.y - fontSize, width: estimatedWidth, height: fontSize * 1.2 }
    default:
      return { x: 0, y: 0, width: 0, height: 0 }
  }
}

/**
 * Get handle coordinates based on position and shape bounds
 */
function getHandleCoords(
  position: HandlePosition,
  bounds: { x: number; y: number; width: number; height: number }
): { x: number; y: number; cursor: string } {
  const { x, y, width, height } = bounds
  const centerX = x + width / 2
  const centerY = y + height / 2
  
  switch (position) {
    case 'tl':
      return { x, y, cursor: 'nwse-resize' }
    case 't':
      return { x: centerX, y, cursor: 'ns-resize' }
    case 'tr':
      return { x: x + width, y, cursor: 'nesw-resize' }
    case 'r':
      return { x: x + width, y: centerY, cursor: 'ew-resize' }
    case 'br':
      return { x: x + width, y: y + height, cursor: 'nwse-resize' }
    case 'b':
      return { x: centerX, y: y + height, cursor: 'ns-resize' }
    case 'bl':
      return { x, y: y + height, cursor: 'nesw-resize' }
    case 'l':
      return { x, y: centerY, cursor: 'ew-resize' }
  }
}

/**
 * ResizeHandles Component
 */
export default function ResizeHandles({ shape, onResizeStart }: ResizeHandlesProps) {
  const bounds = getShapeBounds(shape)
  const handleSize = 8 // Size of handle circles in pixels
  
  // All 8 handle positions
  const positions: HandlePosition[] = ['tl', 't', 'tr', 'r', 'br', 'b', 'bl', 'l']
  
  return (
    <g data-component="resize-handles">
      {positions.map((position) => {
        const { x, y, cursor } = getHandleCoords(position, bounds)
        
        return (
          <circle
            key={position}
            cx={x}
            cy={y}
            r={handleSize / 2}
            fill="white"
            stroke="#0066ff"
            strokeWidth={2}
            style={{ cursor }}
            onMouseDown={(e) => {
              e.stopPropagation() // Don't trigger shape selection
              onResizeStart(position, e)
            }}
            data-handle-type="resize"
            data-handle-position={position}
          />
        )
      })}
    </g>
  )
}

