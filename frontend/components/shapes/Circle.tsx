/**
 * Circle Shape Component
 * 
 * WHY: We need a component to render circle shapes that appear as perfect circles
 * even when the SVG is stretched with preserveAspectRatio="none".
 * 
 * WHAT: Takes CircleShape props and renders an SVG ellipse with compensated radii.
 * 
 * HOW: 
 * - When preserveAspectRatio="none", the SVG stretches non-uniformly if the viewport
 *   aspect ratio doesn't match the viewBox aspect ratio (16:9)
 * - We use an <ellipse> with vector-effect="non-scaling-stroke" approach and
 *   calculate rx and ry to compensate for this stretching
 * - The viewBox is based on 1920x1080, so we adjust radii based on screen aspect ratio
 * - This ensures circles always appear perfectly round on screen
 */

'use client'

import type { CircleShape } from '@/types/canvas'
import { useEffect, useState } from 'react'

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
 * 
 * WHY USE ELLIPSE: With preserveAspectRatio="none", a <circle> would stretch into
 * an oval on non-16:9 viewports. By using <ellipse> and adjusting rx/ry based on
 * the viewport's aspect ratio vs the viewBox's 16:9 ratio, we ensure the shape
 * always appears as a perfect circle on screen.
 */
export default function Circle({ shape, isSelected, onClick, onMouseDown }: CircleProps) {
  const [aspectCorrection, setAspectCorrection] = useState(1)
  
  /**
   * Calculate aspect ratio correction
   * 
   * WHY: We need to adjust the circle's radii to compensate for non-uniform
   * SVG scaling when preserveAspectRatio="none"
   * 
   * HOW: 
   * - viewBox is based on 1920×1080 (aspect ratio 16:9 = 1.778)
   * - If screen is wider than 16:9, x-axis stretches more → need wider ellipse in SVG space
   * - If screen is taller than 16:9, y-axis stretches more → need taller ellipse in SVG space
   */
  useEffect(() => {
    const updateAspectCorrection = () => {
      const viewBoxAspect = 1920 / 1080  // 16:9 = 1.778
      const screenAspect = window.innerWidth / window.innerHeight
      
      // Correction factor: how much more stretched is x vs y
      const correction = screenAspect / viewBoxAspect
      setAspectCorrection(correction)
    }
    
    updateAspectCorrection()
    window.addEventListener('resize', updateAspectCorrection)
    
    return () => window.removeEventListener('resize', updateAspectCorrection)
  }, [])
  
  /**
   * Calculate ellipse radii to appear as a perfect circle
   * 
   * WHY: When the screen is wider than 16:9, the x-axis gets stretched more,
   * so we need to make rx smaller (or ry larger) in SVG space to compensate.
   * 
   * MATH:
   * - If aspectCorrection > 1: screen is wider, x stretches more
   *   → make rx smaller: rx = radius / aspectCorrection, ry = radius
   * - If aspectCorrection < 1: screen is taller, y stretches more  
   *   → make ry smaller: rx = radius, ry = radius * aspectCorrection
   */
  const rx = aspectCorrection >= 1 ? shape.radius / aspectCorrection : shape.radius
  const ry = aspectCorrection >= 1 ? shape.radius : shape.radius * aspectCorrection
  
  return (
    <ellipse
      // Position (cx, cy = center coordinates)
      // Shape.x and shape.y represent the center of the circle
      cx={shape.x}
      cy={shape.y}
      rx={rx}
      ry={ry}
      
      // Visual styling
      fill={shape.color || '#cccccc'}
      
      // Apply rotation if specified
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

