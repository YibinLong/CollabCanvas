/**
 * User Avatars Component - Figma-style User Presence Indicators
 * 
 * WHY: Just like in Figma, users need to see who else is on the canvas at a glance.
 * This component shows circular avatar bubbles with user initials.
 * 
 * WHAT IT SHOWS:
 * - Circular avatars for each connected user
 * - User initials (first letter of each word in their name)
 * - Each user has their own color (matching their cursor)
 * - Tooltips showing full names on hover
 * 
 * HOW IT WORKS:
 * - Takes user names like "Fred Bob" and extracts "FB"
 * - "Joe" becomes "J"
 * - "John F Kennedy" becomes "JFK"
 * - Automatically updates as users join/leave (via the users array from presence)
 * 
 * WHERE: Displayed in the top-right corner of the canvas
 */

'use client'

import { PresenceUser } from './CursorOverlay'

interface UserAvatarsProps {
  users: PresenceUser[]
  currentUserId?: string
}

/**
 * Extract initials from a user's name
 * 
 * WHY: We want to show compact, recognizable identifiers for each user
 * 
 * HOW:
 * - Split name by spaces
 * - Take first letter of each word
 * - Max 3 letters (for names like "John F Kennedy")
 * 
 * EXAMPLES:
 * - "Fred Bob" → "FB"
 * - "Joe" → "J"
 * - "John F Kennedy" → "JFK"
 * - "Mary Jane Watson Parker" → "MJW" (limited to 3)
 */
function getInitials(name: string): string {
  if (!name) return '?'
  
  // Split by spaces and filter out empty strings
  const words = name.trim().split(/\s+/).filter(word => word.length > 0)
  
  if (words.length === 0) return '?'
  
  // Take first letter of each word, maximum 3 letters
  const initials = words
    .slice(0, 3) // Max 3 words
    .map(word => word[0].toUpperCase())
    .join('')
  
  return initials
}

/**
 * User Avatars Component
 * 
 * @param users - Array of connected users from presence hook
 * @param currentUserId - ID of the current user (to highlight them)
 */
export default function UserAvatars({ users, currentUserId }: UserAvatarsProps) {
  // If no users, don't show anything
  if (users.length === 0) {
    return null
  }

  return (
    <div
      data-testid="user-avatars"
      className="flex items-center gap-2"
    >
      {/* User count label */}
      <span className="text-white text-sm mr-1">
        {users.length} {users.length === 1 ? 'user' : 'users'}
      </span>

      {/* Avatar bubbles */}
      <div className="flex items-center -space-x-2">
        {users.map(user => {
          const isCurrentUser = user.id === currentUserId
          const initials = getInitials(user.name)

          return (
            <div
              key={user.id}
              data-testid={`user-avatar-${user.id}`}
              className="relative group"
              title={`${user.name}${isCurrentUser ? ' (You)' : ''}`}
            >
              {/* Avatar circle */}
              <div
                style={{
                  backgroundColor: user.color,
                }}
                className={`
                  w-8 h-8 rounded-full
                  flex items-center justify-center
                  text-white text-xs font-semibold
                  border-2 border-white
                  shadow-md
                  transition-transform duration-200
                  hover:scale-110 hover:z-10
                  cursor-pointer
                  ${isCurrentUser ? 'ring-2 ring-blue-400' : ''}
                `}
              >
                {initials}
              </div>

              {/* Tooltip on hover */}
              <div
                className="
                  absolute top-full mt-2 left-1/2 transform -translate-x-1/2
                  bg-gray-900 text-white text-xs px-2 py-1 rounded
                  whitespace-nowrap
                  opacity-0 group-hover:opacity-100
                  pointer-events-none
                  transition-opacity duration-200
                  z-50
                "
              >
                {user.name}
                {isCurrentUser && <span className="ml-1 text-gray-400">(You)</span>}
                {/* Tooltip arrow */}
                <div
                  className="
                    absolute bottom-full left-1/2 transform -translate-x-1/2
                    w-0 h-0
                    border-l-4 border-l-transparent
                    border-r-4 border-r-transparent
                    border-b-4 border-b-gray-900
                  "
                />
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

