/**
 * Cursor Overlay Component
 * 
 * WHY: In collaborative editing, users need to see where others are pointing.
 * This component renders all other users' cursors on the canvas.
 * 
 * WHAT IT DOES:
 * 1. Displays other users' cursor positions in real-time
 * 2. Shows user names next to cursors
 * 3. Uses distinct colors for each user
 * 4. Hides the current user's own cursor (they see the native cursor instead)
 * 
 * HOW TO USE:
 * <CursorOverlay 
 *   users={connectedUsers} 
 *   currentUserId="user-123"
 * />
 */

'use client'

import { useEffect, useState } from 'react'

/**
 * User with presence data
 * 
 * WHY: We need to track each user's identity, cursor position, and color
 */
export interface PresenceUser {
  id: string
  name: string
  color: string
  cursor?: {
    x: number
    y: number
  }
}

interface CursorOverlayProps {
  users: PresenceUser[]
  currentUserId?: string
}

/**
 * Individual Cursor Component
 * 
 * WHY: Each cursor is a separate element that can be positioned independently.
 * 
 * @param user - User data including position and color
 */
function UserCursor({ user }: { user: PresenceUser }) {
  // Don't render if no cursor or cursor is null (user's mouse left the canvas)
  if (!user.cursor || user.cursor.x === null || user.cursor.y === null) return null

  const { x, y } = user.cursor

  return (
    <div
      data-testid={`cursor-${user.id}`}
      style={{
        position: 'absolute',
        left: `${x}px`,
        top: `${y}px`,
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
 * @param users - Array of connected users with cursor positions
 * @param currentUserId - ID of the current user (to hide their cursor)
 */
export default function CursorOverlay({ users, currentUserId }: CursorOverlayProps) {
  // Filter out current user (they see their native cursor instead)
  const otherUsers = users.filter(user => user.id !== currentUserId)

  return (
    <div
      data-testid="cursor-overlay"
      style={{
        position: 'absolute',
        top: 0,
        left: 0,
        width: '100%',
        height: '100%',
        pointerEvents: 'none', // Allow clicks to pass through to canvas
        overflow: 'hidden',
      }}
    >
      {otherUsers.map(user => (
        <UserCursor key={user.id} user={user} />
      ))}
    </div>
  )
}

