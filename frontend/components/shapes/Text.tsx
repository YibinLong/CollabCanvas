/**
 * Text Shape Component
 * 
 * WHY: We need a component to render text shapes as SVG <text> elements.
 * 
 * WHAT: Takes TextShape props and renders an SVG text element.
 * 
 * HOW: SVG <text> uses x, y for position and can have fontSize, fill, etc.
 */

import type { TextShape } from '@/types/canvas'

interface TextProps {
  shape: TextShape
  isSelected?: boolean
  onClick?: (e: React.MouseEvent) => void
  onMouseDown?: (e: React.MouseEvent) => void
}

/**
 * Text Component
 * 
 * @param shape - The text shape data (position, text content, fontSize, color)
 * @param isSelected - Whether this shape is currently selected
 * @param onClick - Handler for when user clicks this shape
 */
export default function Text({ shape, isSelected, onClick, onMouseDown }: TextProps) {
  return (
    <text
      // Position
      x={shape.x}
      y={shape.y}
      
      // Visual styling
      fill={shape.color || '#000000'}
      fontSize={shape.fontSize || 16}
      fontFamily="Arial, sans-serif"
      
      // Apply rotation if specified
      transform={
        shape.rotation
          ? `rotate(${shape.rotation} ${shape.x} ${shape.y})`
          : undefined
      }
      
      // Selection indicator - add outline when selected
      stroke={isSelected ? '#0066ff' : 'none'}
      strokeWidth={isSelected ? 1 : 0}
      paintOrder="stroke"
      
      // Event handlers
      onClick={onClick}
      onMouseDown={onMouseDown}
      
      // Style cursor
      style={{ cursor: 'pointer', userSelect: 'none' }}
      
      // Data attribute for testing
      data-shape-id={shape.id}
      data-shape-type="text"
    >
      {shape.text}
    </text>
  )
}

