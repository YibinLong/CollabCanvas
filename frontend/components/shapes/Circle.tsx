/**
 * Circle Shape Component
 * 
 * WHY: We need a component to render circle shapes that appear as perfect circles.
 * 
 * WHAT: Takes CircleShape props and renders an SVG circle element inscribed in a bounding box.
 * 
 * HOW: 
 * - Circles now use a bounding box approach (x, y, width, height) like rectangles
 * - The circle is drawn inscribed within this bounding box
 * - This ensures circles stay within canvas boundaries and behave consistently with other shapes
 * - Center is calculated as (x + width/2, y + height/2)
 * - Radius is calculated as min(width, height) / 2 to fit within the box
 */

'use client'

import type { CircleShape } from '@/types/canvas'

interface CircleProps {
  shape: CircleShape
  isSelected?: boolean
  onClick?: (e: React.MouseEvent) => void
  onMouseDown?: (e: React.MouseEvent) => void
  onContextMenu?: (e: React.MouseEvent) => void
}

/**
 * Circle Component
 * 
 * @param shape - The circle shape data (position x,y and bounding box width/height)
 * @param isSelected - Whether this shape is currently selected
 * @param onClick - Handler for when user clicks this shape
 * @param onMouseDown - Handler for when user presses mouse down on this shape
 * @param onContextMenu - Handler for when user right-clicks this shape
 * 
 * WHY BOUNDING BOX: By treating circles like rectangles with a bounding box,
 * we get consistent boundary checking and the circle can never go out of bounds.
 * This is the same approach used by Figma, Sketch, and Adobe XD.
 */
export default function Circle({ shape, isSelected, onClick, onMouseDown, onContextMenu }: CircleProps) {
  // Calculate the center of the bounding box - this is where the circle center will be
  const centerX = shape.x + shape.width / 2
  const centerY = shape.y + shape.height / 2
  
  // Calculate radius as half of the smaller dimension to inscribe circle in the box
  // WHY: Using min(width, height) ensures the circle always fits within the bounding box
  const radius = Math.min(shape.width, shape.height) / 2
  
  return (
    <g
      // Apply rotation to the entire group (bounding box + circle)
      // WHY: When circle is rotated, the dotted bounding box should rotate too
      transform={
        shape.rotation
          ? `rotate(${shape.rotation} ${centerX} ${centerY})`
          : undefined
      }
    >
      {/* Show bounding box only when selected (not while creating)
          WHY: Shows the bounding box for reference when shape is selected */}
      {isSelected && (
        <rect
          x={shape.x}
          y={shape.y}
          width={shape.width}
          height={shape.height}
          fill="none"
          stroke="#0066ff"
          strokeWidth={1}
          strokeDasharray="4 4"
          pointerEvents="none"
        />
      )}
      
      <circle
        // Position (cx, cy = center coordinates)
        // Calculate center from bounding box position
        cx={centerX}
        cy={centerY}
        r={radius}
        
        // Visual styling
        fill={shape.color || '#cccccc'}
        
        // Selection indicator - blue stroke around the circle itself
        stroke={isSelected ? '#0066ff' : 'none'}
        strokeWidth={isSelected ? 2 : 0}
        
        // Event handlers
        onClick={onClick}
        onMouseDown={onMouseDown}
        onContextMenu={onContextMenu}
        
        // Style cursor
        style={{ cursor: 'pointer' }}
        
        // Data attribute for testing
        data-shape-id={shape.id}
        data-shape-type="circle"
      />
    </g>
  )
}

