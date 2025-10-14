/**
 * Circle Shape Component
 * 
 * WHY: We need a component to render circle shapes as SVG <circle> elements.
 * 
 * WHAT: Takes CircleShape props and renders an SVG circle.
 * 
 * HOW: SVG <circle> uses cx (center x), cy (center y), and r (radius).
 * Unlike <rect> which uses top-left corner, circles use center position.
 */

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
      
      // Apply rotation if specified (less common for circles, but supported)
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

