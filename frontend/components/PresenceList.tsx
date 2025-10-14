/**
 * Presence List Component
 * 
 * WHY: Users need to see who else is working on the document.
 * This provides a clear list of all connected users.
 * 
 * WHAT IT SHOWS:
 * - User names
 * - User colors (matching their cursor colors)
 * - Count of connected users
 * - Highlight for current user
 * 
 * WHERE TO USE: Display in the top toolbar or side panel
 */

'use client'

import { PresenceUser } from './CursorOverlay'

interface PresenceListProps {
  users: PresenceUser[]
  currentUserId?: string
}

/**
 * Presence List Component
 * 
 * @param users - Array of connected users
 * @param currentUserId - ID of the current user (to highlight them)
 */
export default function PresenceList({ users, currentUserId }: PresenceListProps) {
  return (
    <div
      data-testid="presence-list"
      className="bg-white border border-gray-200 rounded-lg shadow-sm p-4 min-w-[200px]"
    >
      {/* Header with count */}
      <h3 className="text-sm font-semibold text-gray-700 mb-3">
        Connected Users ({users.length})
      </h3>

      {/* User list */}
      {users.length === 0 ? (
        <p
          data-testid="presence-empty"
          className="text-sm text-gray-500 italic"
        >
          No other users connected
        </p>
      ) : (
        <ul className="space-y-2">
          {users.map(user => {
            const isCurrentUser = user.id === currentUserId

            return (
              <li
                key={user.id}
                data-testid={`presence-user-${user.id}`}
                className={`flex items-center gap-2 text-sm ${
                  isCurrentUser ? 'current-user font-medium' : ''
                }`}
              >
                {/* Color dot indicator */}
                <div
                  style={{
                    width: 12,
                    height: 12,
                    backgroundColor: user.color,
                    borderRadius: '50%',
                    flexShrink: 0,
                    border: '1px solid rgba(0, 0, 0, 0.1)',
                  }}
                />

                {/* User name */}
                <span
                  data-testid={`presence-name-${user.id}`}
                  className="truncate"
                >
                  {user.name}
                  {isCurrentUser && (
                    <span className="ml-1 text-gray-500">(You)</span>
                  )}
                </span>
              </li>
            )
          })}
        </ul>
      )}
    </div>
  )
}

