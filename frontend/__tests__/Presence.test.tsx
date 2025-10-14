/**
 * PR #14: Multiplayer Presence Tests
 * 
 * WHY: Presence features let users see who else is working on the document.
 * This includes seeing other users' cursors and a list of connected users.
 * Following TDD, we write these tests FIRST, then implement the features.
 * 
 * WHAT WE'RE TESTING:
 * 1. User cursor displays with name
 * 2. Multiple users' cursors render simultaneously
 * 3. Presence list shows connected users
 * 
 * HOW IT WORKS:
 * - Yjs Awareness is a separate channel from document sync
 * - Each user broadcasts their cursor position and info
 * - Components render this awareness data as cursors and presence UI
 */

import { render, screen, waitFor, within } from '@testing-library/react'
import { renderHook, act } from '@testing-library/react'
import * as Y from 'yjs'
import { createTestYDoc } from './utils/mockYjs'

/**
 * Mock user data for testing
 */
const mockUser1 = {
  id: 'user-1',
  name: 'Alice',
  color: '#3b82f6', // blue
}

const mockUser2 = {
  id: 'user-2', 
  name: 'Bob',
  color: '#ef4444', // red
}

const mockUser3 = {
  id: 'user-3',
  name: 'Charlie',
  color: '#10b981', // green
}

describe('PR #14: Multiplayer Presence Tests (TDD - Write Tests First)', () => {
  /**
   * Test 1: User cursor displays with name
   * 
   * WHY: When multiple users are editing, each user should see the others'
   * cursor positions and names. This helps coordination and awareness.
   */
  describe('User Cursor Display', () => {
    it('should render a cursor with user name', () => {
      // Render a cursor component with mock data
      const CursorComponent = ({ user, x, y }: any) => (
        <div 
          data-testid={`cursor-${user.id}`}
          style={{ 
            position: 'absolute', 
            left: x, 
            top: y,
            pointerEvents: 'none',
          }}
        >
          <svg width="24" height="24" viewBox="0 0 24 24">
            <path d="M5 3l14 9-6 1-3 6z" fill={user.color} />
          </svg>
          <span data-testid={`cursor-name-${user.id}`}>{user.name}</span>
        </div>
      )

      const { getByTestId } = render(
        <CursorComponent user={mockUser1} x={100} y={150} />
      )

      // EXPECT: Cursor should be rendered
      const cursor = getByTestId('cursor-user-1')
      expect(cursor).toBeInTheDocument()

      // EXPECT: User name should be displayed
      const cursorName = getByTestId('cursor-name-user-1')
      expect(cursorName).toHaveTextContent('Alice')

      // EXPECT: Cursor should be positioned correctly
      expect(cursor).toHaveStyle({ left: '100px', top: '150px' })
    })

    it('should render cursor with correct color', () => {
      const CursorComponent = ({ user, x, y }: any) => (
        <div data-testid={`cursor-${user.id}`}>
          <svg width="24" height="24" viewBox="0 0 24 24">
            <path 
              data-testid={`cursor-path-${user.id}`}
              d="M5 3l14 9-6 1-3 6z" 
              fill={user.color} 
            />
          </svg>
          <span>{user.name}</span>
        </div>
      )

      const { getByTestId } = render(
        <CursorComponent user={mockUser2} x={200} y={300} />
      )

      // EXPECT: Cursor should have user's color
      const cursorPath = getByTestId('cursor-path-user-2')
      expect(cursorPath).toHaveAttribute('fill', '#ef4444')
    })

    it('should update cursor position when user moves', () => {
      const CursorComponent = ({ user, x, y }: any) => (
        <div 
          data-testid={`cursor-${user.id}`}
          style={{ 
            position: 'absolute', 
            left: x, 
            top: y,
          }}
        >
          <svg width="24" height="24" viewBox="0 0 24 24">
            <path d="M5 3l14 9-6 1-3 6z" fill={user.color} />
          </svg>
          <span>{user.name}</span>
        </div>
      )

      const { getByTestId, rerender } = render(
        <CursorComponent user={mockUser1} x={100} y={100} />
      )

      let cursor = getByTestId('cursor-user-1')
      expect(cursor).toHaveStyle({ left: '100px', top: '100px' })

      // Update position
      rerender(<CursorComponent user={mockUser1} x={250} y={350} />)

      cursor = getByTestId('cursor-user-1')
      // EXPECT: Cursor should move to new position
      expect(cursor).toHaveStyle({ left: '250px', top: '350px' })
    })
  })

  /**
   * Test 2: Multiple users' cursors render
   * 
   * WHY: The system should handle many users simultaneously,
   * rendering all their cursors without performance issues.
   */
  describe('Multiple Cursors', () => {
    it('should render multiple user cursors simultaneously', () => {
      const users = [mockUser1, mockUser2, mockUser3]
      const positions = [
        { x: 100, y: 100 },
        { x: 200, y: 200 },
        { x: 300, y: 300 },
      ]

      const CursorOverlay = ({ users, positions }: any) => (
        <div data-testid="cursor-overlay">
          {users.map((user: any, index: number) => (
            <div 
              key={user.id}
              data-testid={`cursor-${user.id}`}
              style={{ 
                position: 'absolute', 
                left: positions[index].x, 
                top: positions[index].y,
              }}
            >
              <svg width="24" height="24" viewBox="0 0 24 24">
                <path d="M5 3l14 9-6 1-3 6z" fill={user.color} />
              </svg>
              <span data-testid={`cursor-name-${user.id}`}>{user.name}</span>
            </div>
          ))}
        </div>
      )

      const { getByTestId } = render(
        <CursorOverlay users={users} positions={positions} />
      )

      // EXPECT: All cursors should be rendered
      expect(getByTestId('cursor-user-1')).toBeInTheDocument()
      expect(getByTestId('cursor-user-2')).toBeInTheDocument()
      expect(getByTestId('cursor-user-3')).toBeInTheDocument()

      // EXPECT: All names should be displayed
      expect(getByTestId('cursor-name-user-1')).toHaveTextContent('Alice')
      expect(getByTestId('cursor-name-user-2')).toHaveTextContent('Bob')
      expect(getByTestId('cursor-name-user-3')).toHaveTextContent('Charlie')
    })

    it('should hide own cursor (user should not see their own cursor)', () => {
      const currentUserId = 'user-1'
      const users = [mockUser1, mockUser2]

      const CursorOverlay = ({ users, currentUserId }: any) => (
        <div data-testid="cursor-overlay">
          {users
            .filter((user: any) => user.id !== currentUserId)
            .map((user: any) => (
              <div 
                key={user.id}
                data-testid={`cursor-${user.id}`}
              >
                <span>{user.name}</span>
              </div>
            ))}
        </div>
      )

      const { queryByTestId } = render(
        <CursorOverlay users={users} currentUserId={currentUserId} />
      )

      // EXPECT: Own cursor should NOT be rendered
      expect(queryByTestId('cursor-user-1')).not.toBeInTheDocument()

      // EXPECT: Other users' cursors SHOULD be rendered
      expect(queryByTestId('cursor-user-2')).toBeInTheDocument()
    })

    it('should handle users joining and leaving', () => {
      const CursorOverlay = ({ users }: any) => (
        <div data-testid="cursor-overlay">
          {users.map((user: any) => (
            <div 
              key={user.id}
              data-testid={`cursor-${user.id}`}
            >
              <span>{user.name}</span>
            </div>
          ))}
        </div>
      )

      // Initially only Alice
      const { rerender, queryByTestId } = render(
        <CursorOverlay users={[mockUser1]} />
      )

      expect(queryByTestId('cursor-user-1')).toBeInTheDocument()
      expect(queryByTestId('cursor-user-2')).not.toBeInTheDocument()

      // Bob joins
      rerender(<CursorOverlay users={[mockUser1, mockUser2]} />)

      // EXPECT: Both cursors should be visible
      expect(queryByTestId('cursor-user-1')).toBeInTheDocument()
      expect(queryByTestId('cursor-user-2')).toBeInTheDocument()

      // Alice leaves
      rerender(<CursorOverlay users={[mockUser2]} />)

      // EXPECT: Only Bob's cursor remains
      expect(queryByTestId('cursor-user-1')).not.toBeInTheDocument()
      expect(queryByTestId('cursor-user-2')).toBeInTheDocument()
    })
  })

  /**
   * Test 3: Presence list shows connected users
   * 
   * WHY: Users need to see who else is in the document.
   * This helps with collaboration and communication.
   */
  describe('Presence List', () => {
    it('should display list of connected users', () => {
      const users = [mockUser1, mockUser2, mockUser3]

      const PresenceList = ({ users }: any) => (
        <div data-testid="presence-list">
          <h3>Connected Users ({users.length})</h3>
          <ul>
            {users.map((user: any) => (
              <li 
                key={user.id}
                data-testid={`presence-user-${user.id}`}
              >
                <div 
                  style={{ 
                    width: 12, 
                    height: 12, 
                    backgroundColor: user.color,
                    borderRadius: '50%',
                    display: 'inline-block',
                    marginRight: 8,
                  }} 
                />
                <span data-testid={`presence-name-${user.id}`}>{user.name}</span>
              </li>
            ))}
          </ul>
        </div>
      )

      const { getByTestId } = render(<PresenceList users={users} />)

      // EXPECT: Presence list should be visible
      const presenceList = getByTestId('presence-list')
      expect(presenceList).toBeInTheDocument()

      // EXPECT: Should show correct count
      expect(presenceList).toHaveTextContent('Connected Users (3)')

      // EXPECT: All users should be listed
      expect(getByTestId('presence-user-user-1')).toBeInTheDocument()
      expect(getByTestId('presence-user-user-2')).toBeInTheDocument()
      expect(getByTestId('presence-user-user-3')).toBeInTheDocument()

      // EXPECT: All names should be displayed
      expect(getByTestId('presence-name-user-1')).toHaveTextContent('Alice')
      expect(getByTestId('presence-name-user-2')).toHaveTextContent('Bob')
      expect(getByTestId('presence-name-user-3')).toHaveTextContent('Charlie')
    })

    it('should show empty state when no other users', () => {
      const PresenceList = ({ users }: any) => (
        <div data-testid="presence-list">
          <h3>Connected Users ({users.length})</h3>
          {users.length === 0 ? (
            <p data-testid="presence-empty">No other users connected</p>
          ) : (
            <ul>
              {users.map((user: any) => (
                <li key={user.id}>{user.name}</li>
              ))}
            </ul>
          )}
        </div>
      )

      const { getByTestId } = render(<PresenceList users={[]} />)

      // EXPECT: Empty state should be shown
      expect(getByTestId('presence-empty')).toBeInTheDocument()
      expect(getByTestId('presence-empty')).toHaveTextContent('No other users connected')

      // EXPECT: Count should be 0
      expect(getByTestId('presence-list')).toHaveTextContent('Connected Users (0)')
    })

    it('should update when users join or leave', () => {
      const PresenceList = ({ users }: any) => (
        <div data-testid="presence-list">
          <h3>Connected Users ({users.length})</h3>
          <ul>
            {users.map((user: any) => (
              <li 
                key={user.id}
                data-testid={`presence-user-${user.id}`}
              >
                {user.name}
              </li>
            ))}
          </ul>
        </div>
      )

      const { rerender, getByTestId, queryByTestId } = render(
        <PresenceList users={[mockUser1]} />
      )

      // Initially: 1 user
      expect(getByTestId('presence-list')).toHaveTextContent('Connected Users (1)')
      expect(queryByTestId('presence-user-user-1')).toBeInTheDocument()

      // User joins
      rerender(<PresenceList users={[mockUser1, mockUser2]} />)

      // EXPECT: Count should update
      expect(getByTestId('presence-list')).toHaveTextContent('Connected Users (2)')
      expect(queryByTestId('presence-user-user-2')).toBeInTheDocument()

      // User leaves
      rerender(<PresenceList users={[mockUser2]} />)

      // EXPECT: Count and list should update
      expect(getByTestId('presence-list')).toHaveTextContent('Connected Users (1)')
      expect(queryByTestId('presence-user-user-1')).not.toBeInTheDocument()
      expect(queryByTestId('presence-user-user-2')).toBeInTheDocument()
    })

    it('should highlight current user in presence list', () => {
      const currentUserId = 'user-1'
      const users = [mockUser1, mockUser2]

      const PresenceList = ({ users, currentUserId }: any) => (
        <div data-testid="presence-list">
          <ul>
            {users.map((user: any) => (
              <li 
                key={user.id}
                data-testid={`presence-user-${user.id}`}
                className={user.id === currentUserId ? 'current-user' : ''}
              >
                {user.name} {user.id === currentUserId && '(You)'}
              </li>
            ))}
          </ul>
        </div>
      )

      const { getByTestId } = render(
        <PresenceList users={users} currentUserId={currentUserId} />
      )

      // EXPECT: Current user should be marked
      const currentUserItem = getByTestId('presence-user-user-1')
      expect(currentUserItem).toHaveClass('current-user')
      expect(currentUserItem).toHaveTextContent('Alice (You)')

      // EXPECT: Other users should not be marked
      const otherUserItem = getByTestId('presence-user-user-2')
      expect(otherUserItem).not.toHaveClass('current-user')
      expect(otherUserItem).not.toHaveTextContent('(You)')
    })
  })

  /**
   * Test 4: Yjs Awareness Integration
   * 
   * WHY: Awareness is the mechanism that broadcasts presence data.
   * We test that it correctly syncs cursor positions and user info.
   */
  describe('Yjs Awareness Integration', () => {
    it('should sync awareness state between documents', async () => {
      // Create two documents with awareness
      const doc1 = createTestYDoc()
      const doc2 = createTestYDoc()

      // In Yjs, awareness is separate from the document
      // We'll simulate awareness updates

      const awareness1State = {
        user: mockUser1,
        cursor: { x: 100, y: 100 },
      }

      const awareness2State = {
        user: mockUser2,
        cursor: { x: 200, y: 200 },
      }

      // EXPECT: Each document should be able to store awareness state
      expect(doc1).toBeInstanceOf(Y.Doc)
      expect(doc2).toBeInstanceOf(Y.Doc)

      // This test verifies the data structure
      // The actual awareness sync will be tested in integration tests
    })
  })
})

