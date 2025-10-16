# Performance Tuning Attempt - Postmortem

**Date:** October 16, 2025  
**Status:** ❌ Failed - Rolled back  
**Goal:** Improve collaboration smoothness to ~60fps while maintaining data integrity

---

## 🎯 What We Tried

### 1. **Cursor Throttle Reduction** ✅ SAFE
- **Change:** Reduced cursor update throttle from 100ms → 16ms
- **File:** `frontend/lib/usePresence.ts`
- **Result:** This worked fine, makes cursors smoother
- **Keep this change:** Yes

### 2. **RequestAnimationFrame Batching** ⚠️ SAFE BUT TIMING ISSUES
- **Change:** Replaced `setTimeout(50ms)` with `requestAnimationFrame` for syncing
- **File:** `frontend/lib/useYjsSync.ts`
- **Goal:** Sync updates with browser's 60fps repaint cycle
- **Result:** Works in theory, but introduced timing complexities

### 3. **Transaction Wrapping** ✅ SAFE
- **Change:** Wrapped multiple Yjs updates in `doc.transact()`
- **Goal:** Batch network messages
- **Result:** This is a good optimization

### 4. **Initial Load Logic** ❌ CATASTROPHIC FAILURE
- **Attempts:**
  - First tried blocking local sync until `synced` event fires
  - Then tried `synced` event listener
  - Finally tried 500ms timeout
- **Why it failed:** See below

---

## 💥 Why It Failed

### Root Cause: The Initial Load Problem

**The Core Issue:**
When a user connects to Yjs, there are TWO data sources:
1. **Local Zustand store** (empty on refresh, may have shapes on first connect)
2. **Yjs document** (has the "truth" from the server)

**The Race Condition:**
```
Time 0ms:  User connects, local store is empty
Time 10ms: Zustand subscription starts watching for changes
Time 50ms: Yjs starts syncing shapes from server
Time 100ms: Some shapes arrive in Yjs document
Time 200ms: More shapes arrive
Time 500ms: Our timeout fires to "load initial shapes"
```

**The Problem:**
- If we load too early, we miss shapes still syncing
- If we load too late, user sees glitches
- If we block local sync, users can't create new shapes
- If we don't block, empty local store might clear server shapes

### Why the `synced` Event Doesn't Work

The `y-websocket` provider's `synced` event is **unreliable**:
- Sometimes fires immediately (before shapes load)
- Sometimes never fires at all
- No guarantee shapes have finished syncing
- Different behavior across browsers

### The Fundamental Design Flaw

**Yjs is designed for CRDT (conflict-free replicated data types):**
- It assumes all clients eventually see all changes
- It doesn't have a "load then sync" model
- It's continuous sync, not request/response

**Our app needs:**
- Clear "load existing" phase
- Then "sync changes" phase
- This doesn't match Yjs's philosophy

---

## 🐛 Bugs Introduced

1. **Shapes disappear on refresh**
   - User refreshes → empty local store → syncs to Yjs → everyone loses work

2. **Different users see different shapes**
   - User A has shapes locally
   - User B connects, doesn't load them
   - They diverge

3. **Glitchy updates**
   - Shapes appear/disappear randomly
   - Race between local sync and initial load
   - `isSyncingFromYjs` flag confusion

4. **Double shapes**
   - Load from Yjs, then receive same update again
   - Sync loop issues

---

## 📚 Key Learnings

### 1. **Don't Rely on Events**
The `synced` event, `status` event, etc. from `y-websocket` are not reliable for critical logic like initial loading.

### 2. **Timing is Hard**
Fixed timeouts (500ms, 2000ms) don't work because:
- Network speeds vary
- Document sizes vary
- Race conditions are unpredictable

### 3. **The Real Problem**
The issue isn't just performance - it's that we're trying to add "load before sync" logic to a system (Yjs) designed for continuous syncing.

### 4. **What Works Before Performance**
The original code worked because:
- The 50ms timeout gave enough buffer for most cases
- The full map diff caught all changes reliably
- It was slower, but it was CORRECT

---

## 🔧 What We Should Have Done

### Option 1: Keep It Simple (Recommended)
Just keep the original sync logic and accept the performance:
- 50ms timeout works
- Full map diff is reliable
- Frame-based batching can still help a bit

### Option 2: Backend-Driven Initial Load
Instead of guessing when to load:
```
1. User connects to Yjs
2. ALSO send HTTP request: GET /canvas/:id/shapes
3. Load shapes from HTTP response
4. Then start Yjs sync for updates only
```
This separates "initial load" from "live sync"

### Option 3: Different Architecture
Use Yjs only for real-time updates:
- Store "source of truth" in Supabase
- Load initial state from Supabase
- Use Yjs only for live collaboration
- Periodically persist Yjs → Supabase

---

## 🎓 Performance vs Correctness

**The Hard Truth:**
- Smooth 60fps collaboration is HARD
- Figma, Google Docs, etc. have teams of engineers on this
- They use custom protocols, not off-the-shelf Yjs
- Getting it right requires deep CRDT knowledge

**Better Approach:**
1. Get it working correctly first (you had this)
2. Profile to find actual bottlenecks
3. Optimize the slow parts specifically
4. Don't rebuild the whole sync engine

---

## ✅ What to Keep from This Attempt

1. **Cursor throttle reduction (16ms)** - Safe and works
2. **Transaction wrapping** - Good optimization
3. **Better logging** - Helps debug issues
4. **Understanding of the timing problems** - Knowledge for future

## ❌ What to Discard

1. All the initial load timing logic
2. The `synced` event listener
3. The blocking flags
4. The timeout-based loading

---

## 🔄 Next Steps (If Pursuing Performance)

### Immediate: Revert to Working State
```bash
git diff frontend/lib/useYjsSync.ts  # See changes
git checkout frontend/lib/useYjsSync.ts  # Revert sync logic
# Keep cursor throttle change in usePresence.ts
```

### If Revisiting Performance:

1. **Profile First**
   - Use Chrome DevTools Performance tab
   - Record during shape dragging
   - Find actual bottleneck (is it Yjs? React? Canvas rendering?)

2. **Targeted Optimizations**
   - If React rendering is slow: Memoize components
   - If canvas drawing is slow: Use offscreen canvas
   - If Yjs is slow: Reduce update frequency on drag

3. **Consider Alternatives**
   - Look into `yjs-leveldb` for better server persistence
   - Consider `automerge` instead of Yjs
   - Look at how Excalidraw does real-time collaboration

---

## 💡 The Brutal Lesson

**"Make it work, make it right, make it fast" - in that order.**

We skipped "make it right" when adding performance optimizations, and broke "make it work". The original code was correct but slow. The new code was fast but broken. Correctness always comes first in collaborative systems, because data loss is unacceptable.

---

## 📝 Code Locations

- Original working code: Check git history before this branch
- Performance changes: See `PERFORMANCE_CODE_DIFF.md`
- This postmortem: `PERFORMANCE_ATTEMPT_POSTMORTEM.md`

## Final Note

Real-time collaboration is one of the hardest problems in software engineering. The fact that it mostly worked before this optimization attempt means the architecture is sound. Focus on making it bulletproof before making it fast.

