/**
 * Circle Shape Component
 * 
 * WHY: We need a component to render circle shapes that appear as perfect circles.
 * 
 * WHAT: Takes CircleShape props and renders an SVG circle element.
 * 
 * HOW: 
 * - Since the Canvas now uses preserveAspectRatio="xMidYMid meet", the SVG maintains
 *   its aspect ratio and shapes render with correct proportions
 * - We simply use a <circle> element with a single radius value
 * - This ensures circles always appear perfectly round on screen
 */

'use client'

import type { CircleShape } from '@/types/canvas'

interface CircleProps {
  shape: CircleShape
  isSelected?: boolean
  onClick?: (e: React.MouseEvent) => void
  onMouseDown?: (e: React.MouseEvent) => void
}

/**
 * Circle Component
 * 
 * @param shape - The circle shape data (position, radius, color)
 * @param isSelected - Whether this shape is currently selected
 * @param onClick - Handler for when user clicks this shape
 * @param onMouseDown - Handler for when user presses mouse down on this shape
 * 
 * WHY USE CIRCLE: With preserveAspectRatio="xMidYMid meet", the SVG maintains
 * proper aspect ratio, so a simple <circle> element renders as a perfect circle.
 */
export default function Circle({ shape, isSelected, onClick, onMouseDown }: CircleProps) {
  return (
    <circle
      // Position (cx, cy = center coordinates)
      // Shape.x and shape.y represent the center of the circle
      cx={shape.x}
      cy={shape.y}
      r={shape.radius}
      
      // Visual styling
      fill={shape.color || '#cccccc'}
      
      // Apply rotation if specified (though circles look the same when rotated)
      transform={
        shape.rotation
          ? `rotate(${shape.rotation} ${shape.x} ${shape.y})`
          : undefined
      }
      
      // Selection indicator
      stroke={isSelected ? '#0066ff' : 'none'}
      strokeWidth={isSelected ? 2 : 0}
      
      // Event handlers
      onClick={onClick}
      onMouseDown={onMouseDown}
      
      // Style cursor
      style={{ cursor: 'pointer' }}
      
      // Data attribute for testing
      data-shape-id={shape.id}
      data-shape-type="circle"
    />
  )
}

