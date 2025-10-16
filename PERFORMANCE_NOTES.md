# Collaboration Performance Notes

## Overview
- **Goal:** make real-time canvas edits feel smoother (target ~60 fps) while keeping Supabase + Yjs architecture intact.
- **Key Changes Implemented:**
  - Added a frame-scheduled flush in `useYjsSync` so outgoing updates ride the browser's rendering loop instead of a 50 ms timer.
  - Introduced event-based tracking in `canvasStore` (`subscribeToShapeChanges`) so only changed shape IDs sync, avoiding full-map diffs.
  - Reduced cursor throttling in `usePresence` to ~16 ms for smoother remote cursors.
  - Added generous logging around Yjs sync, version restore, and clear-all paths for troubleshooting.

## Current Regressions / Open Issues
- **Version history restore** can race with the new 60 fps sync loop.
  - Local store clearing emits `cleared: true` and previously caused Yjs document clears. This was patched, but state can still thrash if reconnect happens before backend finishes restoring.
  - Reload-based fallback works but feels heavy and reintroduces a momentary blank state.
- **Initial load persisting shapes** occasionally misses the restored state—likely because the store clears before `synced` fires, then reconnect sees 0 shapes and never rehydrates.

## Ideas to Harden Version History Flow
- **Explicit restore handshake:**
  - Client calls `/restore`, waits for `restore-complete` event via WebSocket (or HTTP response carrying an incrementing restore token).
  - On next `synced`, verify the token matches before clearing local state.
- **Atomic local swap:**
  - Instead of clearing Zustand immediately, load restored shapes into a temp map, then swap references once confirm comes from Yjs.
- **Disable outgoing sync during restore:**
  - Introduce an `isRestoring` flag that suppresses new `pendingUpdates` until `synced` arrives to avoid the store re-posting stale shapes.
- **Persisted snapshot pull:**
  - After restore completes, fetch the saved snapshot directly from backend via REST, apply to Zustand, and let Yjs reconcile.

## Debbuging/Observability Checks
- ✅ `app/page.tsx`, `useYjsSync.ts`, and `canvasStore.ts` already contain timestamped logging for restore, clear-all, and sync events.
- ✅ Backend controller (`documentController.ts`) logs in-memory shape counts during restore.
- ✅ The new logs highlight when local store clears, when Yjs ignores changes, and how many shapes load after sync.

## Next Steps (if keeping the performance upgrade)
1. Add a server-confirmed restore token or ack event before reconnecting.
2. Gate local store clearing behind that ack to avoid clearing Yjs prematurely.
3. Add integration test covering: save version → create V2 → restore V1 → ensure both clients see V1 shapes.

*If the issues persist and time is short, rolling back to the 50 ms timer plus original version restore flow will restore stability at the cost of drag smoothness.*
