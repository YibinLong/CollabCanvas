# Performance Optimization Attempts

This folder contains documentation of attempts to improve real-time collaboration performance.

## Files

### `PERFORMANCE_ATTEMPT_POSTMORTEM.md`
**Date:** October 16, 2025  
**Status:** ❌ Failed

Complete postmortem of the 60fps collaboration optimization attempt. Details what was tried, why it failed, and key learnings about real-time collaboration systems.

**Key Takeaway:** Correctness must come before performance in collaborative systems.

### `PERFORMANCE_CODE_DIFF.md`
Exact code changes that were attempted during the performance tuning. Shows the event-based tracking, frame batching, and sync modifications that were tested.

### `PERFORMANCE_NOTES.md`
Original planning notes for the performance improvements, including identified regressions and ideas for hardening the version history flow.

## Summary

**Goal:** Improve canvas collaboration from ~20fps to ~60fps

**What Worked:**
- ✅ Cursor throttle reduction (100ms → 16ms)
- ✅ Transaction batching for Yjs updates
- ✅ Better logging for debugging

**What Failed:**
- ❌ Event-based sync tracking (introduced race conditions)
- ❌ Initial load timing with `synced` event (unreliable)
- ❌ Blocking local sync until loaded (broke user experience)

**Why It Failed:**
The fundamental issue was trying to add "load before sync" logic to Yjs, which is designed for continuous CRDT synchronization. The timing-based approaches created race conditions that caused data loss and sync glitches.

## Lessons Learned

1. **Profile before optimizing** - We didn't identify the actual bottleneck
2. **Don't rebuild core systems** - Yjs sync logic works, optimize around it
3. **Timing is unreliable** - Events and timeouts in distributed systems are hard
4. **Start simple** - Keep the 50ms timeout, add optimizations incrementally

## If Revisiting Performance

1. Use Chrome DevTools to profile and find the REAL bottleneck
2. Consider whether the issue is Yjs, React rendering, or Canvas drawing
3. Look at targeted optimizations (memoization, virtual rendering, etc.)
4. Study how production tools (Figma, Excalidraw) handle collaboration

## Related Documentation

- `/docs/guides/VERSION_HISTORY_FEATURE.md` - Feature that broke during optimization
- `/docs/status-reports/PERFORMANCE_FIXES_COMPLETE.md` - Previous performance work
- `/docs/testing/` - Testing guides that could catch these issues earlier

