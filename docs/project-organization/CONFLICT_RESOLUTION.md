# Conflict Resolution System

## Overview

The Figma Clone now includes a **shape locking mechanism** to prevent conflicts when multiple users try to edit the same shape simultaneously. This ensures that only one user can move, resize, or modify a shape at a time.

## How It Works

### 1. Lock Acquisition
When a user starts interacting with a shape (clicking to move or grabbing a resize handle):
- The system checks if the shape is already locked by another user
- If locked, the interaction is blocked with a console message
- If not locked, the shape is locked with the current user's ID and a timestamp

### 2. Lock Release
Locks are automatically released when:
- The user finishes their interaction (releases mouse button)
- The lock times out (30 seconds of inactivity)
- The user disconnects (handled by the timeout mechanism)

### 3. Visual Feedback
Users can see which shapes are locked:
- **Red dashed border** around locked shapes
- **Lock icon with "🔒 Locked" text** above the shape
- **No resize handles** shown on locked shapes (even if selected)
- **Console messages** when trying to interact with locked shapes

## Technical Implementation

### Data Structure
Each shape now includes two new fields:
```typescript
interface BaseShape {
  // ... existing fields
  lockedBy?: string | null;  // User ID of who's editing it
  lockedAt?: number | null;   // Timestamp when locked (for timeout detection)
}
```

### Store Actions
New actions added to `canvasStore`:
- `lockShape(id, userId)` - Lock a shape for editing
- `unlockShape(id)` - Release a lock
- `isShapeLocked(id, currentUserId)` - Check if shape is locked by another user
- `releaseAllLocks(userId)` - Release all locks held by a user

### Lock Timeout
- **Timeout Duration**: 30 seconds
- **Check Interval**: Every 5 seconds
- Automatically releases stale locks to prevent permanent locking if a user's browser crashes

## User Experience

### For User A (who has the lock):
1. Click and drag a shape
2. Shape is locked immediately
3. Can move/resize freely
4. Lock released on mouse up

### For User B (trying to edit the same shape):
1. Try to click and drag the shape
2. See red dashed border and lock icon
3. Interaction is blocked
4. Console shows: "Shape is currently being edited by another user"
5. Must wait until User A releases the lock

### For All Users:
- Can still SELECT locked shapes (just can't modify them)
- Cannot DELETE shapes locked by others
- See real-time visual indicators
- Automatic recovery from crashed sessions (30s timeout)

## Testing the Locking System

### Manual Test Steps:

1. **Open two browser windows** (or use two different browsers)
2. **Log in as two different users** in each window
3. **Navigate to the same document** in both windows
4. **Create a rectangle** in one window
5. **Try these scenarios:**

   **Scenario A: Concurrent Move Attempt**
   - User 1: Click and hold the rectangle (start moving)
   - User 2: Try to click and move the same rectangle
   - ✅ Expected: User 2 sees red border and lock icon, cannot move it

   **Scenario B: Lock Release**
   - User 1: Click and hold the rectangle
   - User 1: Release the mouse button
   - User 2: Now try to move the rectangle
   - ✅ Expected: User 2 can now move it (lock was released)

   **Scenario C: Resize Lock**
   - User 1: Click a resize handle and start resizing
   - User 2: Try to resize from another handle
   - ✅ Expected: User 2 sees the lock indicator, cannot resize

   **Scenario D: Lock Timeout**
   - User 1: Start moving a shape
   - User 1: Close the browser tab (simulating a crash)
   - User 2: Wait 30 seconds
   - User 2: Try to move the shape
   - ✅ Expected: Lock automatically released, User 2 can now edit

   **Scenario E: Delete Protection**
   - User 1: Start moving a shape
   - User 2: Select the shape and press Delete
   - ✅ Expected: Shape is not deleted (console shows warning)

## Code Locations

### Files Modified:
1. `frontend/types/canvas.ts` - Added `lockedBy` and `lockedAt` fields to BaseShape
2. `frontend/lib/canvasStore.ts` - Added lock/unlock actions and lock checking
3. `frontend/components/Canvas.tsx` - Implemented lock acquisition, release, timeout, and visual indicators

### Key Functions:
- **Lock Acquisition**: `Canvas.tsx` lines 545, 442 (in `handleShapeMouseDown` and `handleResizeStart`)
- **Lock Release**: `Canvas.tsx` line 372 (in `handleMouseUp`)
- **Lock Timeout**: `Canvas.tsx` lines 542-562 (useEffect with interval)
- **Visual Indicators**: `Canvas.tsx` lines 637-673 (in `renderShape`)

## Future Enhancements

Potential improvements:
1. **Toast Notifications**: Show a user-friendly message instead of console logs
2. **Show User Name**: Display which specific user has the lock (e.g., "Locked by John")
3. **Lock Request System**: Allow users to "request" a lock with a notification to the current holder
4. **Optimistic Locking**: Allow both users to edit but show conflict resolution UI if collision detected
5. **Lock Duration Display**: Show countdown timer of how long a lock has been held
6. **Lock Priority**: Give priority to users who have been waiting longer

## Benefits

✅ **Prevents Data Corruption**: No conflicting edits overwriting each other
✅ **Clear User Feedback**: Visual indicators show exactly what's happening
✅ **Automatic Recovery**: Timeout mechanism prevents permanent locks
✅ **Sync with Yjs**: Lock state is synced in real-time across all clients
✅ **User-Friendly**: Intuitive visual design with lock icons and colored borders

## Conclusion

The conflict resolution system ensures smooth collaborative editing by preventing simultaneous modifications. Users always know when a shape is being edited by someone else, and the system automatically recovers from edge cases like browser crashes.

