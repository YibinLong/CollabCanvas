# Version History Feature

## Overview

The version history feature allows users to save snapshots of their canvas at any point in time and restore them later. This is essential for recovering from mistakes, reverting major changes, or tracking the evolution of a design.

## Features Implemented ✅

### 1. **Backend API Routes** (Backend)
- `GET /api/documents/:id/versions` - Get list of all versions
- `POST /api/documents/:id/versions` - Manually save a version snapshot with optional label
- `POST /api/documents/:id/versions/:versionId/restore` - Restore a previous version

### 2. **Database** (Already existed)
- `DocumentVersion` table stores up to 50 snapshots per document
- Automatic cleanup removes old versions beyond the 50-version limit
- Each version includes:
  - `id` - Unique identifier
  - `documentId` - Which document it belongs to
  - `yjsState` - Binary snapshot of the canvas state
  - `label` - Optional user-provided description
  - `createdAt` - Timestamp

### 3. **Frontend API Client** (Frontend - supabase.ts)
- `getVersionHistory(documentId)` - Fetch all versions for a document
- `restoreVersion(documentId, versionId)` - Restore a specific version
- `createVersionSnapshot(documentId, label?)` - Manually save a snapshot

### 4. **UI Component** (Frontend - VersionHistory.tsx)
A beautiful slide-out panel inspired by Figma's design:
- **Clean, modern interface** with dark theme matching the app
- **Version list** showing all snapshots with timestamps
- **Smart time formatting** ("2 hours ago", "March 15 at 3:45 PM")
- **One-click restore** with confirmation prompt
- **Manual save button** with optional label input
- **Empty state** when no versions exist yet
- **Loading states** and error handling
- **Backdrop overlay** for dismissal

### 5. **Integration** (Frontend - page.tsx)
- "History" button in the main header (next to user avatars)
- Clock icon for easy recognition
- Opens the slide-out panel when clicked

## How It Works

### Saving Versions

**Automatic (Future Enhancement):**
The backend service includes functions for automatic versioning, but they need to be wired up to triggers (e.g., save every 5 minutes, or after N changes).

**Manual:**
1. User clicks "History" button in header
2. Panel slides out from the right
3. User clicks "+ Save Current Version"
4. Optionally enters a label (e.g., "Before redesign")
5. Backend captures the current Yjs state and saves it to `DocumentVersion` table
6. Version appears in the list

### Restoring Versions

1. User clicks "History" button in header
2. Panel shows list of all saved versions
3. User hovers over a version → "Restore" button appears
4. User clicks "Restore"
5. Confirmation dialog appears: "Restore this version? This will replace the current state."
6. User confirms
7. Backend:
   - Loads the version's Yjs state
   - Updates the main Document's yjsState
   - Creates a new version snapshot labeled "Restored from [date]"
8. Yjs WebSocket broadcasts the change to all connected users
9. Everyone's canvas updates in real-time to show the restored state

## User Experience

### Visual Design (Figma-inspired)

```
┌─────────────────────────────────┐
│ Version History            [X]  │  ← Header with close button
├─────────────────────────────────┤
│ + Save Current Version          │  ← Primary action button
├─────────────────────────────────┤
│ Before AI redesign        [···] │  ← Version with label
│ 2 hours ago             Restore │
├─────────────────────────────────┤
│ Untitled version          [···] │  ← Version without label
│ Yesterday at 3:45 PM    Restore │
├─────────────────────────────────┤
│ Final review version      [···] │
│ March 15 at 2:30 PM     Restore │
├─────────────────────────────────┤
│ ...more versions...             │
├─────────────────────────────────┤
│ Up to 50 versions are kept      │  ← Footer info
└─────────────────────────────────┘
```

### Interaction Flow

1. **Opening:** Click "History" button → Panel slides in from right with backdrop
2. **Viewing:** Scroll through versions, see labels and timestamps
3. **Hovering:** Restore button fades in on hover
4. **Saving:** Click "+ Save Current Version" → Input appears → Type label (optional) → Press Enter or click Save
5. **Restoring:** Click Restore → Confirm → Success message → Panel refreshes
6. **Closing:** Click X, click backdrop, or press Escape (future enhancement)

## Code Structure

### Backend

**Controller** (`backend/src/controllers/documentController.ts`):
```typescript
export async function getVersions(req, res) { ... }
export async function restoreVersion(req, res) { ... }
export async function createVersionSnapshot(req, res) { ... }
```

**Service** (`backend/src/services/yjsPersistence.ts`):
```typescript
export async function saveVersion(documentId, ydoc, label?) { ... }
export async function loadVersion(versionId) { ... }
export async function getVersionHistory(documentId) { ... }
```

**Routes** (`backend/src/routes/documentRoutes.ts`):
```typescript
router.get('/:id/versions', getVersions)
router.post('/:id/versions/:versionId/restore', restoreVersion)
router.post('/:id/versions', createVersionSnapshot)
```

### Frontend

**API Client** (`frontend/lib/supabase.ts`):
```typescript
export async function getVersionHistory(documentId) { ... }
export async function restoreVersion(documentId, versionId) { ... }
export async function createVersionSnapshot(documentId, label?) { ... }
```

**Component** (`frontend/components/VersionHistory.tsx`):
```tsx
export default function VersionHistory({ documentId, isOpen, onClose }) { ... }
```

**Integration** (`frontend/app/page.tsx`):
```tsx
const [versionHistoryOpen, setVersionHistoryOpen] = useState(false)

<button onClick={() => setVersionHistoryOpen(true)}>History</button>

<VersionHistory 
  documentId={documentId}
  isOpen={versionHistoryOpen}
  onClose={() => setVersionHistoryOpen(false)}
/>
```

## Authorization

All version history endpoints require authentication via JWT token:
- Users can only view/restore versions for documents they own
- Unauthorized access returns 401 (Unauthorized)
- Access to other users' documents returns 403 (Access Denied)

## Real-time Sync

When a version is restored:
1. Backend updates the Document's yjsState in the database
2. Yjs WebSocket server detects the change
3. Broadcasts update to all connected clients
4. Each client's useYjsSync hook receives the update
5. Canvas re-renders with the restored state
6. All users see the change in real-time

## Testing

### Manual Testing Steps

1. **Start the app:**
   ```bash
   # Terminal 1 - Backend
   cd backend && npm run dev
   
   # Terminal 2 - Frontend
   cd frontend && npm run dev
   ```

2. **Test saving versions:**
   - Draw some shapes on the canvas
   - Click "History" button
   - Click "+ Save Current Version"
   - Enter label: "Test version 1"
   - Press Enter or click Save
   - Verify version appears in the list

3. **Test restoring versions:**
   - Draw more shapes (make the canvas different)
   - Click "History" button
   - Find the "Test version 1" version
   - Hover over it → "Restore" button appears
   - Click "Restore" → Confirm
   - Verify canvas returns to previous state
   - Verify a new version appears labeled "Restored from [date]"

4. **Test real-time sync:**
   - Open two browser windows to the same document
   - In window 1: Restore a version
   - Verify window 2 updates in real-time

5. **Test empty state:**
   - Create a new document (or one with no versions)
   - Click "History" button
   - Verify empty state message appears

6. **Test 50-version limit:**
   - Would need to create 51+ versions to test cleanup
   - Backend automatically keeps only the 50 most recent

### Automated Testing

The feature can be tested with Jest/React Testing Library:

```typescript
describe('Version History', () => {
  it('displays version list when opened', async () => { ... })
  it('allows saving a new version with label', async () => { ... })
  it('allows restoring a previous version', async () => { ... })
  it('shows empty state when no versions exist', async () => { ... })
  it('handles API errors gracefully', async () => { ... })
})
```

## Future Enhancements

1. **Automatic versioning:**
   - Save version every 5 minutes when canvas changes
   - Save version on major actions (e.g., delete all shapes, paste many shapes)

2. **Version comparison:**
   - Show diff between two versions
   - Preview a version before restoring

3. **Version branching:**
   - Create named checkpoints
   - Branch from any version

4. **Collaborative versions:**
   - Show who created each version
   - Filter by user

5. **Version search:**
   - Search versions by label
   - Filter by date range

6. **Keyboard shortcuts:**
   - Cmd+Shift+H to open version history
   - Escape to close panel

## Troubleshooting

### "No auth token available"
- User is not logged in
- Session expired → Refresh page to get new token

### "Failed to load version history"
- Backend server is down → Check terminal for errors
- Database connection issue → Check Prisma connection
- User doesn't own document → Authorization error

### "Failed to restore version"
- Version doesn't exist (was deleted)
- Database error → Check backend logs
- Network issue → Check console for errors

### Version history is empty
- No versions have been saved yet
- Click "+ Save Current Version" to create first snapshot

## Related Files

**Backend:**
- `backend/prisma/schema.prisma` - Database schema with DocumentVersion model
- `backend/src/services/yjsPersistence.ts` - Version save/load/list functions
- `backend/src/controllers/documentController.ts` - API endpoint handlers
- `backend/src/routes/documentRoutes.ts` - Route definitions

**Frontend:**
- `frontend/lib/supabase.ts` - API client functions
- `frontend/components/VersionHistory.tsx` - UI component
- `frontend/app/page.tsx` - Integration into main page
- `frontend/types/document.ts` - TypeScript type definitions

## Summary

The version history feature is fully implemented with:
✅ Backend API routes with authentication
✅ Database schema (already existed)
✅ Frontend API client functions
✅ Beautiful Figma-inspired UI component
✅ Integration into main page header
✅ Real-time sync when restoring versions
✅ Smart time formatting
✅ Loading and error states
✅ Empty state handling
✅ Automatic cleanup (50-version limit)

Users can now confidently make changes knowing they can always restore previous versions!

