/**
 * Line Shape Component
 * 
 * WHY: We need a component to render line shapes as SVG <line> elements.
 * 
 * WHAT: Takes LineShape props and renders an SVG line.
 * 
 * HOW: SVG <line> uses x1, y1 (start point) and x2, y2 (end point).
 */

import type { LineShape } from '@/types/canvas'

interface LineProps {
  shape: LineShape
  isSelected?: boolean
  onClick?: (e: React.MouseEvent) => void
  onMouseDown?: (e: React.MouseEvent) => void
  onContextMenu?: (e: React.MouseEvent) => void
}

/**
 * Line Component
 * 
 * @param shape - The line shape data (start point, end point, color)
 * @param isSelected - Whether this shape is currently selected
 * @param onClick - Handler for when user clicks this shape
 * @param onContextMenu - Handler for when user right-clicks this shape
 */
export default function Line({ shape, isSelected, onClick, onMouseDown, onContextMenu }: LineProps) {
  return (
    <line
      // Start and end points
      x1={shape.x}
      y1={shape.y}
      x2={shape.x2}
      y2={shape.y2}
      
      // Visual styling
      stroke={shape.color || '#000000'}
      // Selection indicator - make line thicker when selected
      strokeWidth={isSelected ? (shape.strokeWidth || 2) + 2 : (shape.strokeWidth || 2)}
      
      // Apply rotation if specified (rotates around start point)
      transform={
        shape.rotation
          ? `rotate(${shape.rotation} ${shape.x} ${shape.y})`
          : undefined
      }
      
      // Event handlers
      onClick={onClick}
      onMouseDown={onMouseDown}
      onContextMenu={onContextMenu}
      
      // Style cursor
      style={{ cursor: 'pointer' }}
      
      // Data attribute for testing
      data-shape-id={shape.id}
      data-shape-type="line"
    />
  )
}

