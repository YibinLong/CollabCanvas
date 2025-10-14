# 🐛 Persistence Bug Fix - CRITICAL

## 🚨 The Problem You Found

**Symptom:** `yjs_state` changed from `NULL` to `\x0000` (empty bytes) but stayed empty even after adding many shapes.

**Root Cause:** We were saving the **WRONG Yjs document**!

### What Was Happening:

```
┌─────────────────────────────────────────────────────────┐
│  Frontend                                                │
│  ├─ User draws shapes                                   │
│  └─ Sends updates via WebSocket                         │
└──────────────────────┬──────────────────────────────────┘
                       │
                       ▼
┌─────────────────────────────────────────────────────────┐
│  Backend - y-websocket Library                          │
│  ├─ Receives updates                                    │
│  ├─ Applies to internal Yjs document (docs Map)         │
│  └─ ✅ This document has ALL the shapes!                │
└─────────────────────────────────────────────────────────┘
                       │
                       ▼
┌─────────────────────────────────────────────────────────┐
│  Our Persistence Code (WRONG!)                          │
│  ├─ Created separate room.doc                           │
│  ├─ ❌ This document was EMPTY                          │
│  └─ ❌ Saved empty document to database                 │
└─────────────────────────────────────────────────────────┘
                       │
                       ▼
┌─────────────────────────────────────────────────────────┐
│  Database                                                │
│  └─ yjs_state = \x0000 (empty!) ❌                      │
└─────────────────────────────────────────────────────────┘
```

### Why It Happened:

The `y-websocket` library manages its own internal `docs` Map where it stores the actual Yjs documents that users are editing. We were:

1. ✅ Creating our own `room.doc` 
2. ❌ But users were editing the document in `y-websocket`'s internal `docs` Map
3. ❌ We saved our empty `room.doc` instead of the actual document
4. ❌ Result: Database got empty bytes `\x0000`

## ✅ The Fix

**Integrated with y-websocket's persistence system!**

### Changes Made:

#### 1. **Use y-websocket's Persistence Callbacks**

```typescript
// NEW: Register persistence callbacks with y-websocket
if (enablePersistence) {
  setPersistence({
    // Called when y-websocket needs to load a document
    bindState: async (docName: string, ydoc: Y.Doc) => {
      const loadedDoc = await loadYjsDocument(docName)
      const state = Y.encodeStateAsUpdate(loadedDoc)
      Y.applyUpdate(ydoc, state)
    },
    
    // Called when y-websocket triggers a save
    writeState: async (docName: string, ydoc: Y.Doc) => {
      await saveYjsDocument(docName, ydoc)
    }
  })
}
```

**WHY:** y-websocket now calls our functions with the CORRECT document.

#### 2. **Added Auto-Save for Active Documents**

```typescript
// Save all active documents every 10 seconds
setInterval(async () => {
  for (const [docName, ydoc] of docs.entries()) {
    await saveYjsDocument(docName, ydoc)
  }
}, 10000)
```

**WHY:** y-websocket doesn't auto-save, so we manually save all active documents.

#### 3. **Fixed Disconnect Save**

```typescript
// OLD (WRONG):
await saveYjsDocument(roomName, room.doc) // Empty document!

// NEW (CORRECT):
const ydoc = docs.get(roomName) // Get actual document from y-websocket
await saveYjsDocument(roomName, ydoc) // Save the right one!
```

**WHY:** Now we save the document users actually edited.

## 📊 How It Works Now

```
┌─────────────────────────────────────────────────────────┐
│  Frontend                                                │
│  ├─ User draws shapes                                   │
│  └─ Sends updates via WebSocket                         │
└──────────────────────┬──────────────────────────────────┘
                       │
                       ▼
┌─────────────────────────────────────────────────────────┐
│  Backend - y-websocket Library                          │
│  ├─ Receives updates                                    │
│  ├─ Applies to internal Yjs document (docs Map)         │
│  └─ ✅ Document has ALL the shapes                      │
└──────────────────────┬──────────────────────────────────┘
                       │
                       ▼
┌─────────────────────────────────────────────────────────┐
│  Our Persistence Code (FIXED!)                          │
│  ├─ Auto-save interval (every 10 sec)                   │
│  ├─ Gets document from docs.get(roomName)               │
│  ├─ ✅ This is the ACTUAL document with shapes          │
│  └─ ✅ Saves it to database                             │
└──────────────────────┬──────────────────────────────────┘
                       │
                       ▼
┌─────────────────────────────────────────────────────────┐
│  Database                                                │
│  └─ yjs_state = [ALL SHAPES BINARY] ✅                  │
└─────────────────────────────────────────────────────────┘
```

## 🔍 What Changed in Code

### `backend/src/services/websocketServer.ts`

#### Import y-websocket's docs Map:
```typescript
import { setupWSConnection, setPersistence, docs } from 'y-websocket/bin/utils'
```

#### Register persistence callbacks:
```typescript
setPersistence({
  bindState: async (docName, ydoc) => { /* load */ },
  writeState: async (docName, ydoc) => { /* save */ }
})
```

#### Auto-save interval:
```typescript
setInterval(async () => {
  for (const [docName, ydoc] of docs.entries()) {
    await saveYjsDocument(docName, ydoc) // Saves the REAL document!
  }
}, 10000)
```

#### Disconnect save:
```typescript
const ydoc = docs.get(roomName) // Get actual document
await saveYjsDocument(roomName, ydoc) // Save it
```

## 🧪 Testing the Fix

### 1. **Restart Your Backend**

If running locally:
```bash
cd backend
# Stop the server (Ctrl+C)
npm run dev
```

If deployed, redeploy with the new code.

### 2. **Watch Logs**

You should see:
```
[Persistence] ✅ Persistence callbacks registered with y-websocket
[Persistence] ⏰ Auto-save interval started (every 10 seconds)
```

### 3. **Draw Shapes**

Open your app and draw some shapes.

### 4. **Check Logs Every 10 Seconds**

```
[Persistence] 🔄 Auto-save: Checking 1 active documents...
[Persistence] 💾 writeState called for test-document-123
[Persistence] Saved document test-document-123 (567 bytes)  ← NOT empty!
[Persistence] ✅ Auto-saved test-document-123
```

### 5. **Check Database**

In Supabase:
```sql
SELECT id, LENGTH(yjs_state) as bytes 
FROM documents 
WHERE id = 'test-document-123';
```

Should show:
```
id                  | bytes
--------------------|-------
test-document-123   | 567    ← Growing as you add shapes!
```

**NOT** `2 bytes` or `NULL` anymore!

### 6. **Test Persistence**

1. Draw shapes
2. Close ALL browser tabs
3. Wait for final save:
   ```
   [WS] 📭 Room test-document-123 is now empty
   [WS] 💾 Saving room test-document-123 to database...
   [Persistence] Saved document test-document-123 (567 bytes)
   [WS] ✅ Room test-document-123 saved successfully
   ```
4. Open app again
5. **Shapes should be there!** ✅

## 🎯 Expected Behavior Now

### While Editing:
- Auto-save every 10 seconds
- `yjs_state` grows with each shape
- Logs show actual byte counts (not 2 bytes)

### On Disconnect:
- Final save when last user leaves
- `yjs_state` has latest state

### On Reconnect:
- Loads `yjs_state` from database
- All shapes restored
- Canvas looks exactly as you left it

## ✅ Verification Checklist

- [ ] Backend restarts successfully
- [ ] Logs show "Persistence callbacks registered"
- [ ] Logs show "Auto-save interval started"
- [ ] Drawing shapes triggers auto-save every 10 sec
- [ ] `yjs_state` size grows (check Supabase)
- [ ] Disconnecting triggers final save
- [ ] Reconnecting restores all shapes
- [ ] Database has actual shape data (not `\x0000`)

## 📝 Summary

**Before:** Saved empty `room.doc` → Database got `\x0000` → Shapes lost
**After:** Save actual document from `docs` Map → Database gets real data → Shapes persist! ✅

The fix ensures we're always saving the **actual document users are editing**, not a separate empty document we created.

Your canvas persistence should work perfectly now! 🎉

