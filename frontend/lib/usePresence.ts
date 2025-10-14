/**
 * Presence Hook - Manage User Awareness (PR #23 - UPDATED!)
 * 
 * WHY: Yjs Awareness is a separate channel from document sync that handles
 * ephemeral data like cursor positions and online status. This hook manages
 * all presence-related functionality.
 * 
 * WHAT IT DOES:
 * 1. Tracks current user's cursor position
 * 2. Broadcasts cursor position to other users
 * 3. Receives other users' cursor positions
 * 4. Manages user colors and names
 * 5. Handles join/leave events
 * 
 * Uses authenticated user identity (name/email) for personalized presence.
 * 
 * HOW TO USE:
 * const { users, updateCursor } = usePresence(provider, currentUser)
 */

import { useEffect, useState, useCallback, useRef } from 'react'
import { WebsocketProvider } from 'y-websocket'
import { Awareness } from 'y-protocols/awareness'
import type { PresenceUser } from '@/components/CursorOverlay'
import { useAuth } from './AuthContext'

/**
 * Current user data
 */
export interface CurrentUser {
  id: string
  name: string
  color: string
}

/**
 * Hook return value
 */
interface UsePresenceReturn {
  users: PresenceUser[]
  updateCursor: (x: number | null, y: number | null) => void
  setUserInfo: (user: CurrentUser) => void
}

/**
 * Predefined colors for users
 * 
 * WHY: Each user needs a distinct color for their cursor.
 * We cycle through these colors as users join.
 */
const USER_COLORS = [
  '#3b82f6', // blue
  '#ef4444', // red
  '#10b981', // green
  '#f59e0b', // amber
  '#8b5cf6', // purple
  '#ec4899', // pink
  '#14b8a6', // teal
  '#f97316', // orange
]

/**
 * Get a color for a user based on their ID
 * 
 * WHY: Deterministic color assignment ensures the same user
 * always gets the same color across sessions.
 */
function getUserColor(userId: string): string {
  // Simple hash function to get consistent color
  let hash = 0
  for (let i = 0; i < userId.length; i++) {
    hash = userId.charCodeAt(i) + ((hash << 5) - hash)
  }
  const index = Math.abs(hash) % USER_COLORS.length
  return USER_COLORS[index]
}

/**
 * usePresence Hook
 * 
 * @param provider - WebSocket provider (from useYjsSync)
 * @param currentUser - Current user's information
 * @returns Object with users array and update functions
 */
export function usePresence(
  provider: WebsocketProvider | null,
  currentUser?: CurrentUser
): UsePresenceReturn {
  // State for all connected users
  const [users, setUsers] = useState<PresenceUser[]>([])
  
  // Ref to track awareness instance
  const awarenessRef = useRef<Awareness | null>(null)

  /**
   * Update cursor position
   * 
   * WHY: Called on every mouse move to broadcast position to other users.
   * We throttle this to avoid overwhelming the network.
   * 
   * IMPORTANT: Pass null to hide the cursor (when mouse leaves canvas)
   */
  const updateCursor = useCallback(
    (x: number | null, y: number | null) => {
      if (!awarenessRef.current || !currentUser) return

      // Get current awareness state
      const currentState = awarenessRef.current.getLocalState() || {}

      // If x or y is null, hide the cursor by removing cursor property
      if (x === null || y === null) {
        awarenessRef.current.setLocalState({
          ...currentState,
          cursor: null, // Hide cursor
        })
        return
      }

      // Update with new cursor position
      awarenessRef.current.setLocalState({
        ...currentState,
        cursor: { x, y },
      })
    },
    [currentUser]
  )

  /**
   * Set or update user information
   * 
   * WHY: When user logs in or changes their name, update awareness.
   */
  const setUserInfo = useCallback((user: CurrentUser) => {
    if (!awarenessRef.current) return

    awarenessRef.current.setLocalState({
      user: {
        id: user.id,
        name: user.name,
        color: user.color || getUserColor(user.id),
      },
      cursor: { x: 0, y: 0 },
    })
  }, [])

  /**
   * Initialize awareness when provider is available
   */
  useEffect(() => {
    if (!provider) return

    /**
     * Get awareness from provider
     * 
     * WHY: The WebSocket provider includes an Awareness instance
     * that handles presence synchronization.
     */
    const awareness = provider.awareness
    awarenessRef.current = awareness

    /**
     * Set initial local state
     * 
     * WHY: Tell other users about ourselves when we join.
     */
    if (currentUser) {
      awareness.setLocalState({
        user: {
          id: currentUser.id,
          name: currentUser.name,
          color: currentUser.color || getUserColor(currentUser.id),
        },
        cursor: { x: 0, y: 0 },
      })
    }

    /**
     * Handle awareness changes
     * 
     * WHY: When users join, leave, or move their cursor, we need to
     * update our local state to re-render the UI.
     * 
     * IMPORTANT: Deduplicate by user.id to avoid showing the same user
     * multiple times when they have multiple tabs open. Each tab gets a
     * unique clientId from Yjs, but we only want to show each unique user once.
     */
    const handleAwarenessChange = () => {
      const states = awareness.getStates()
      
      // Use a Map to deduplicate by user.id
      // WHY: Same user can have multiple tabs (multiple clientIds) but should
      // only appear once in the user list. We keep the most recent state.
      const userMap = new Map<string, PresenceUser>()

      // Convert awareness states to our PresenceUser format
      states.forEach((state, clientId) => {
        if (state.user) {
          // Only add/update if this user.id isn't already in the map
          // or if we want to update their cursor position
          userMap.set(state.user.id, {
            id: state.user.id,
            name: state.user.name,
            color: state.user.color,
            cursor: state.cursor,
          })
        }
      })

      // Convert Map values back to array
      const allUsers = Array.from(userMap.values())
      setUsers(allUsers)
    }

    // Listen for changes
    awareness.on('change', handleAwarenessChange)

    // Initial update
    handleAwarenessChange()

    /**
     * Cleanup on unmount
     * 
     * WHY: Remove our presence when leaving the document.
     */
    return () => {
      awareness.off('change', handleAwarenessChange)
      
      // Clear our local state (tells others we've left)
      awareness.setLocalState(null)
    }
  }, [provider, currentUser])

  // Throttled version of updateCursor for performance
  const throttledUpdateCursor = useCallback(
    throttle(updateCursor, 100),
    [updateCursor]
  )

  return {
    users,
    updateCursor: throttledUpdateCursor,
    setUserInfo,
  }
}

/**
 * Throttle function for cursor updates
 * 
 * WHY: Mouse moves fire very frequently (potentially 60+ times per second).
 * Throttling reduces network traffic while maintaining smooth cursor movement.
 * 
 * @param func - Function to throttle
 * @param limit - Minimum time between calls (milliseconds)
 */
export function throttle<T extends (...args: any[]) => void>(
  func: T,
  limit: number
): (...args: Parameters<T>) => void {
  let inThrottle: boolean
  let lastArgs: Parameters<T> | null = null
  
  return function (this: any, ...args: Parameters<T>) {
    if (!inThrottle) {
      func.apply(this, args)
      inThrottle = true
      lastArgs = null
      setTimeout(() => {
        inThrottle = false
        // If there was a call while throttled, execute it now
        if (lastArgs) {
          func.apply(this, lastArgs)
          lastArgs = null
        }
      }, limit)
    } else {
      // Store the last call to execute after throttle period
      lastArgs = args
    }
  }
}

