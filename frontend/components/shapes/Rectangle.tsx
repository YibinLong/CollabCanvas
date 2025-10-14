/**
 * Rectangle Shape Component
 * 
 * WHY: We need a component to render rectangle shapes as SVG <rect> elements.
 * This component receives shape data and renders it visually.
 * 
 * WHAT: Takes RectangleShape props and renders an SVG rectangle.
 * 
 * HOW: SVG <rect> uses x, y, width, height attributes for positioning and size.
 * We apply rotation using CSS transform for better performance.
 */

import type { RectangleShape } from '@/types/canvas'

interface RectangleProps {
  shape: RectangleShape
  isSelected?: boolean
  onClick?: (e: React.MouseEvent) => void
  onMouseDown?: (e: React.MouseEvent) => void
}

/**
 * Rectangle Component
 * 
 * @param shape - The rectangle shape data (position, size, color)
 * @param isSelected - Whether this shape is currently selected
 * @param onClick - Handler for when user clicks this shape
 */
export default function Rectangle({ shape, isSelected, onClick, onMouseDown }: RectangleProps) {
  return (
    <rect
      // Position and size
      x={shape.x}
      y={shape.y}
      width={shape.width}
      height={shape.height}
      
      // Visual styling
      fill={shape.color || '#cccccc'}
      
      // Apply rotation if specified
      // SVG transform uses the shape's center as the rotation origin
      transform={
        shape.rotation
          ? `rotate(${shape.rotation} ${shape.x + shape.width / 2} ${shape.y + shape.height / 2})`
          : undefined
      }
      
      // Selection indicator - add a stroke when selected
      stroke={isSelected ? '#0066ff' : 'none'}
      strokeWidth={isSelected ? 2 / (shape.zIndex || 1) : 0}
      
      // Event handlers
      onClick={onClick}
      onMouseDown={onMouseDown}
      
      // Style cursor to indicate clickability
      style={{ cursor: 'pointer' }}
      
      // Data attribute for testing
      data-shape-id={shape.id}
      data-shape-type="rect"
    />
  )
}

