/**
 * Cursor Overlay Component
 * 
 * WHY: In collaborative editing, users need to see where others are pointing.
 * This component renders all other users' cursors on the canvas, converting
 * SVG coordinates to screen coordinates.
 * 
 * WHAT IT DOES:
 * 1. Receives cursor positions in SVG coordinates (universal across users)
 * 2. Converts them to screen coordinates based on viewport (pan/zoom)
 * 3. Displays cursors in the correct positions regardless of window size
 * 4. Shows user names next to cursors
 * 5. Uses distinct colors for each user
 * 
 * HOW TO USE:
 * <CursorOverlay 
 *   users={connectedUsers} 
 *   currentUserId="user-123"
 *   svgRef={svgRef}
 *   viewport={viewport}
 * />
 */

'use client'

import { RefObject } from 'react'

/**
 * User with presence data
 * 
 * WHY: We need to track each user's identity, cursor position, and color.
 * Cursor positions are stored in SVG coordinates (not screen pixels).
 */
export interface PresenceUser {
  id: string
  name: string
  color: string
  cursor?: {
    x: number  // SVG x coordinate
    y: number  // SVG y coordinate
  }
}

/**
 * Viewport state for coordinate conversion
 */
interface Viewport {
  x: number
  y: number
  zoom: number
}

interface CursorOverlayProps {
  users: PresenceUser[]
  currentUserId?: string
  svgRef: RefObject<SVGSVGElement>
  viewport: Viewport
  canvasWidth?: number  // Actual canvas width in pixels
  canvasHeight?: number // Actual canvas height in pixels
}

/**
 * Individual Cursor Component
 * 
 * WHY: Each cursor is a separate element that can be positioned independently.
 * Receives SVG coordinates and converts them to screen pixels.
 * 
 * @param user - User data including SVG position and color
 * @param svgRef - Reference to the SVG element for coordinate conversion
 * @param viewport - Current viewport state (pan/zoom)
 * @param canvasWidth - Actual canvas width (for accurate coordinate conversion)
 * @param canvasHeight - Actual canvas height (for accurate coordinate conversion)
 */
function UserCursor({ 
  user, 
  svgRef, 
  viewport,
  canvasWidth,
  canvasHeight
}: { 
  user: PresenceUser
  svgRef: RefObject<SVGSVGElement>
  viewport: Viewport
  canvasWidth?: number
  canvasHeight?: number
}) {
  // Don't render if no cursor or cursor is null (user's mouse left the canvas)
  if (!user.cursor || user.cursor.x === null || user.cursor.y === null) return null

  /**
   * Convert SVG coordinates to screen pixel coordinates
   * 
   * WHY: User cursor positions are transmitted in SVG coordinates (which are
   * universal across all users), but we need to display them at screen pixel
   * positions. This is the inverse of the screenToSVG function in Canvas.
   * 
   * HOW: 
   * 1. Get the SVG element's bounding rectangle on screen
   * 2. Calculate viewBox dimensions based on zoom AND actual canvas size
   * 3. Convert SVG coords to normalized coords (0-1) within viewBox
   * 4. Convert normalized coords to screen pixels within bounding rect
   * 
   * CRITICAL: Must use the same dimensions as Canvas.tsx for accurate sync!
   */
  const svgToScreen = (svgX: number, svgY: number): { x: number; y: number } => {
    if (!svgRef.current) return { x: svgX, y: svgY }
    
    const rect = svgRef.current.getBoundingClientRect()
    
    // Guard against invalid dimensions
    if (!rect.width || !rect.height || rect.width === 0 || rect.height === 0) {
      return { x: svgX, y: svgY }
    }
    
    // Use actual canvas dimensions (same as Canvas.tsx)
    // Fall back to rect dimensions if not provided
    const actualWidth = canvasWidth ?? rect.width
    const actualHeight = canvasHeight ?? rect.height
    
    // Calculate viewBox dimensions (must match Canvas.tsx exactly!)
    const viewBoxWidth = actualWidth / viewport.zoom
    const viewBoxHeight = actualHeight / viewport.zoom
    const viewBoxX = -viewport.x / viewport.zoom
    const viewBoxY = -viewport.y / viewport.zoom
    
    // Convert SVG coords to screen coords
    // This is the inverse of the screenToSVG calculation
    const normalizedX = (svgX - viewBoxX) / viewBoxWidth
    const normalizedY = (svgY - viewBoxY) / viewBoxHeight
    
    const screenX = rect.left + normalizedX * rect.width
    const screenY = rect.top + normalizedY * rect.height
    
    return { x: screenX, y: screenY }
  }

  const screenPos = svgToScreen(user.cursor.x, user.cursor.y)

  return (
    <div
      data-testid={`cursor-${user.id}`}
      style={{
        position: 'fixed', // Fixed relative to viewport, not absolute
        left: `${screenPos.x}px`,
        top: `${screenPos.y}px`,
        pointerEvents: 'none', // Don't block clicks
        zIndex: 1000, // Above canvas elements
        transition: 'left 0.1s ease-out, top 0.1s ease-out', // Smooth movement
      }}
    >
      {/* Cursor SVG icon */}
      <svg
        width="24"
        height="24"
        viewBox="0 0 24 24"
        style={{
          filter: 'drop-shadow(0 1px 2px rgba(0, 0, 0, 0.3))',
        }}
      >
        <path
          data-testid={`cursor-path-${user.id}`}
          d="M5 3l14 9-6 1-3 6z"
          fill={user.color}
          stroke="white"
          strokeWidth="1"
        />
      </svg>

      {/* User name label */}
      <div
        data-testid={`cursor-name-${user.id}`}
        style={{
          position: 'absolute',
          top: '24px',
          left: '10px',
          backgroundColor: user.color,
          color: 'white',
          padding: '2px 6px',
          borderRadius: '4px',
          fontSize: '12px',
          fontWeight: 500,
          whiteSpace: 'nowrap',
          boxShadow: '0 1px 3px rgba(0, 0, 0, 0.2)',
        }}
      >
        {user.name}
      </div>
    </div>
  )
}

/**
 * Cursor Overlay Component
 * 
 * WHY: This is the main container that renders all cursors.
 * It filters out the current user's cursor and positions all others.
 * 
 * @param users - Array of connected users with cursor positions (in SVG coords)
 * @param currentUserId - ID of the current user (to hide their cursor)
 * @param svgRef - Reference to SVG element for coordinate conversion
 * @param viewport - Current viewport state for coordinate conversion
 * @param canvasWidth - Actual canvas width (for accurate coordinate conversion)
 * @param canvasHeight - Actual canvas height (for accurate coordinate conversion)
 */
export default function CursorOverlay({ 
  users, 
  currentUserId, 
  svgRef, 
  viewport,
  canvasWidth,
  canvasHeight
}: CursorOverlayProps) {
  // Filter out current user (they see their native cursor instead)
  const otherUsers = users.filter(user => user.id !== currentUserId)

  return (
    <>
      {/* Render each cursor individually with fixed positioning */}
      {otherUsers.map(user => (
        <UserCursor 
          key={user.id} 
          user={user} 
          svgRef={svgRef}
          viewport={viewport}
          canvasWidth={canvasWidth}
          canvasHeight={canvasHeight}
        />
      ))}
    </>
  )
}

