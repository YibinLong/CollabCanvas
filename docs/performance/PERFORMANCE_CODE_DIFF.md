# Performance Tuning - Actual Code Diffs

> Exact code changes made during the 60 fps collaboration performance tuning. Use this to understand what changed or to revert if needed.

---

## `frontend/lib/canvasStore.ts`

### Added: Event-based shape change tracking system

```diff
+/**
+ * Shape change event
+ * 
+ * WHY: We want to know exactly which shapes changed so the Yjs sync hook can
+ * send only the necessary updates instead of diffing the entire map.
+ */
+export interface ShapeChangeEvent {
+  updated: Set<string>
+  deleted: Set<string>
+  cleared?: boolean
+}
+
+type ShapeChangeListener = (event: ShapeChangeEvent) => void
+
+const shapeChangeListeners = new Set<ShapeChangeListener>()
+
+function notifyShapeChange(event: ShapeChangeEvent) {
+  shapeChangeListeners.forEach((listener) => listener(event))
+}
+
+export function subscribeToShapeChanges(listener: ShapeChangeListener): () => void {
+  shapeChangeListeners.add(listener)
+  return () => {
+    shapeChangeListeners.delete(listener)
+  }
+}
+
+function notifyChanges({
+  updatedIds = [],
+  deletedIds = [],
+  cleared = false,
+}: {
+  updatedIds?: Iterable<string>
+  deletedIds?: Iterable<string>
+  cleared?: boolean
+}) {
+  const updated = new Set(Array.from(updatedIds).filter(Boolean))
+  const deleted = new Set(Array.from(deletedIds).filter(Boolean))
+
+  if (updated.size === 0 && deleted.size === 0 && !cleared) {
+    return
+  }
+
+  console.log('[Store] 📢 Notifying shape changes:', {
+    updated: updated.size,
+    deleted: deleted.size,
+    cleared
+  })
+
+  notifyShapeChange({
+    updated,
+    deleted,
+    cleared,
+  })
+}
```

### Modified: All shape mutation actions now notify listeners

```diff
  addShape: (shape: Shape) => {
    set((state) => {
      const newShapes = new Map(state.shapes)
      newShapes.set(shape.id, shape)
      return { shapes: newShapes }
    })
+
+   notifyChanges({ updatedIds: [shape.id] })
  },
```

```diff
  updateShape: (id: string, updates: Partial<Shape>) => {
+   let didUpdate = false
+
    set((state) => {
      const shape = state.shapes.get(id)
      if (!shape) return state
      
      const newShapes = new Map(state.shapes)
      newShapes.set(id, { ...shape, ...updates } as Shape)
+     didUpdate = true
      return { shapes: newShapes }
    })
+
+   if (didUpdate) {
+     notifyChanges({ updatedIds: [id] })
+   }
  },
```

```diff
  updateMultipleShapes: (updates: Array<{ id: string; updates: Partial<Shape> }>) => {
+   const changedIds: string[] = []
+
    set((state) => {
      const newShapes = new Map(state.shapes)
      let hasChanges = false
      
      updates.forEach(({ id, updates: shapeUpdates }) => {
        const shape = state.shapes.get(id)
        if (shape) {
          newShapes.set(id, { ...shape, ...shapeUpdates } as Shape)
          hasChanges = true
+         changedIds.push(id)
        }
      })
      
      return hasChanges ? { shapes: newShapes } : state
    })
+
+   if (changedIds.length > 0) {
+     notifyChanges({ updatedIds: changedIds })
+   }
  },
```

```diff
  removeShape: (id: string) => {
+   let wasRemoved = false
+
    set((state) => {
      const newShapes = new Map(state.shapes)
-     newShapes.delete(id)
+     wasRemoved = newShapes.delete(id)
      
      const newSelectedIds = state.selectedIds.filter((selectedId) => selectedId !== id)
      
      return { 
        shapes: newShapes,
        selectedIds: newSelectedIds,
      }
    })
+
+   if (wasRemoved) {
+     notifyChanges({ deletedIds: [id] })
+   }
  },
```

```diff
  clearShapes: () => {
+   const hadShapes = useCanvasStore.getState().shapes.size > 0
+
    set({ shapes: new Map(), selectedIds: [] })
+
+   if (hadShapes) {
+     notifyChanges({ cleared: true })
+   }
  },
```

```diff
  deleteSelected: () => {
+   let deletedIds: string[] = []
+
    set((state) => {
      if (state.selectedIds.length === 0) return state
      
      const newShapes = new Map(state.shapes)
-     const remainingSelectedIds: string[] = []
+     deletedIds = state.selectedIds.filter((id) => newShapes.delete(id))
      
-     state.selectedIds.forEach(id => {
-       const shape = state.shapes.get(id)
-       newShapes.delete(id)
-     })
+     if (deletedIds.length === 0) {
+       return state
+     }
      
      return {
        shapes: newShapes,
        selectedIds: [],
      }
    })
+
+   if (deletedIds.length > 0) {
+     notifyChanges({ deletedIds })
+   }
  },
```

Similar changes applied to: `lockShape`, `unlockShape`, `releaseAllLocks`, `bringToFront`, `bringForward`, `sendBackward`, `sendToBack`

---

## `frontend/lib/useYjsSync.ts`

### Changed: Import shape change events from canvasStore

```diff
-import { useCanvasStore } from './canvasStore'
+import { useCanvasStore, subscribeToShapeChanges, type ShapeChangeEvent } from './canvasStore'
```

### Added: Clear local store on mount to prevent stale data

```diff
  useEffect(() => {
    if (!enabled) {
      console.log('[Yjs] Sync disabled (user not logged in)')
      return
    }

+   // Clear Zustand store on initial mount to prevent stale data after version restore
+   console.log('[Yjs] 🧹 Clearing local store on mount')
+   const currentShapeCount = useCanvasStore.getState().shapes.size
+   if (currentShapeCount > 0) {
+     console.log(`[Yjs] Found ${currentShapeCount} stale shapes, clearing...`)
+     useCanvasStore.getState().clearShapes()
+   }

    const initializeConnection = async () => {
```

### Added: Synced event listener for initial load

```diff
    provider.on('connection-error', (err: Error) => {
      console.error('[Yjs] Connection error:', err)
      setStatus('error')
      setError(err.message || 'Failed to connect to collaboration server')
    })
+   
+   /**
+    * Listen for initial sync completion
+    * 
+    * WHY: When we first connect, we need to load any existing shapes from the document.
+    * The 'synced' event fires when the provider has finished the initial sync with the server.
+    */
+   provider.on('synced', (event: { synced: boolean }) => {
+     console.log('[Yjs] 🔄 Sync event received:', { synced: event.synced, shapesInDoc: shapesMap.size })
+     
+     if (event.synced) {
+       if (shapesMap.size > 0) {
+         console.log(`[Yjs] 📥 Initial sync complete. Loading ${shapesMap.size} existing shapes`)
+         isSyncingFromYjs.current = true
+         
+         // Clear local store first to ensure clean state
+         useCanvasStore.getState().clearShapes()
+         
+         shapesMap.forEach((yjsShape, shapeId) => {
+           const shapeData = yjsMapToObject(yjsShape as Y.Map<unknown>) as Shape
+           console.log(`[Yjs] Loading shape ${shapeId}:`, shapeData.type)
+           addOrUpdateShapeFromRemote(shapeId, shapeData)
+         })
+         
+         isSyncingFromYjs.current = false
+         console.log('[Yjs] ✅ Initial shapes loaded successfully')
+       } else {
+         console.log('[Yjs] ✅ Initial sync complete. No shapes in document')
+       }
+     }
+   })
    
    setStatus('connecting')
```

### Changed: Replaced timer-based sync with requestAnimationFrame

**BEFORE:**
```typescript
    let syncTimeout: NodeJS.Timeout | null = null
    const pendingUpdates = new Set<string>()
    
    const syncToYjs = () => {
      if (isSyncingFromYjs.current) return
      
      const state = useCanvasStore.getState()
      
      pendingUpdates.forEach((shapeId) => {
        const shape = state.shapes.get(shapeId)
        
        if (shape) {
          let yjsShape = shapesMap.get(shapeId) as Y.Map<any>
          if (!yjsShape) {
            yjsShape = new Y.Map()
            shapesMap.set(shapeId, yjsShape)
          }
          
          Object.entries(shape).forEach(([key, value]) => {
            if (value !== undefined) {
              yjsShape.set(key, value)
            }
          })
        } else {
          shapesMap.delete(shapeId)
        }
      })
      
      pendingUpdates.clear()
    }
    
    const unsubscribe = useCanvasStore.subscribe((state, prevState) => {
      if (isSyncingFromYjs.current) return

      state.shapes.forEach((shape, shapeId) => {
        const prevShape = prevState.shapes.get(shapeId)
        if (!prevShape || shapeHasChanged(prevShape, shape)) {
          pendingUpdates.add(shapeId)
        }
      })

      prevState.shapes.forEach((_shape, shapeId) => {
        if (!state.shapes.has(shapeId)) {
          pendingUpdates.add(shapeId)
        }
      })

      if (syncTimeout) {
        clearTimeout(syncTimeout)
      }

      syncTimeout = setTimeout(syncToYjs, 50)
    })
```

**AFTER:**
```typescript
    const pendingUpdates = new Set<string>()
    let frameScheduled = false

    const scheduleFrame = (callback: () => void) => {
      if (typeof window !== 'undefined' && typeof window.requestAnimationFrame === 'function') {
        window.requestAnimationFrame(() => callback())
      } else {
        setTimeout(callback, 16)
      }
    }

    const flushPendingUpdates = () => {
      if (isSyncingFromYjs.current || pendingUpdates.size === 0) return

      const state = useCanvasStore.getState()
      const updates = Array.from(pendingUpdates)
      pendingUpdates.clear()

      console.log('[Yjs] 🔄 Flushing', updates.length, 'shape updates to Yjs')

      doc.transact(() => {
        updates.forEach((shapeId) => {
          const shape = state.shapes.get(shapeId)

          if (shape) {
            let yjsShape = shapesMap.get(shapeId) as Y.Map<unknown>
            if (!yjsShape) {
              yjsShape = new Y.Map()
              shapesMap.set(shapeId, yjsShape)
            }

            Object.entries(shape).forEach(([key, value]) => {
              if (value !== undefined) {
                yjsShape.set(key, value)
              }
            })
          } else {
            shapesMap.delete(shapeId)
          }
        })
      })
      
      console.log('[Yjs] ✅ Flushed updates to Yjs')
    }

    const scheduleSync = () => {
      if (frameScheduled || pendingUpdates.size === 0) {
        return
      }

      frameScheduled = true

      scheduleFrame(() => {
        frameScheduled = false
        flushPendingUpdates()

        if (pendingUpdates.size > 0) {
          scheduleSync()
        }
      })
    }

    const handleShapeChange = (event: ShapeChangeEvent) => {
      if (isSyncingFromYjs.current) {
        console.log('[Yjs] Ignoring shape change during Yjs sync')
        return
      }

      console.log('[Yjs] 📤 Shape change event:', {
        updated: event.updated.size,
        deleted: event.deleted.size,
        cleared: event.cleared
      })

      if (event.cleared) {
        // IMPORTANT: Don't clear the Yjs document here!
        // The 'cleared' event means the LOCAL Zustand store was cleared,
        // but we don't want to clear the shared Yjs document unless
        // the user explicitly deleted all shapes.
        console.log('[Yjs] ⚠️  Local store cleared - NOT clearing Yjs document')
        pendingUpdates.clear()
        return
      }

      event.updated.forEach((id) => pendingUpdates.add(id))
      event.deleted.forEach((id) => pendingUpdates.add(id))

      if (pendingUpdates.size > 0) {
        console.log('[Yjs] 📤 Scheduling sync for', pendingUpdates.size, 'shapes')
        scheduleSync()
      }
    }

    const unsubscribeShapeChanges = subscribeToShapeChanges(handleShapeChange)
```

### Modified: Cleanup on unmount

```diff
      return () => {
        // Clear any pending sync
-       if (syncTimeout) {
-         clearTimeout(syncTimeout)
-         syncToYjs()
+       if (pendingUpdates.size > 0) {
+         flushPendingUpdates()
        }
        
        pendingUpdates.clear()
-       syncPending.current = false
+       frameScheduled = false
        
        shapesMap.unobserveDeep(handleYjsUpdate)
-       unsubscribe()
+       unsubscribeShapeChanges()
        provider.disconnect()
        provider.destroy()
        doc.destroy()
      }
```

### Added: Enhanced logging for debugging

```diff
    const handleYjsUpdate = (events: Y.YEvent<unknown>[], transaction: Y.Transaction) => {
      if (transaction.local) return
      
+     console.log('[Yjs] 📥 Received remote update with', events.length, 'events')
+     
      isSyncingFromYjs.current = true
```

---

## `frontend/lib/usePresence.ts`

### Changed: Reduced cursor throttle from 100ms to 16ms

```diff
-  const throttledUpdateCursor = useCallback(
-    throttle(updateCursor, 100),
-    [updateCursor]
-  )
+  const throttledUpdateCursor = useMemo(() => throttle(updateCursor, 16), [updateCursor])
```

### Added: Import useMemo

```diff
-import { useEffect, useState, useCallback, useRef } from 'react'
+import { useEffect, useState, useCallback, useRef, useMemo } from 'react'
```

---

## `frontend/app/page.tsx`

### Modified: Version restore now reloads page with delay

```diff
  const handleVersionRestore = () => {
-   // Small delay to let the user see the success message
+   console.log('[App] 🔄 Version restore completed on backend')
+   
+   // Simply reload the page to get the restored state
+   // This is the most reliable approach as it:
+   // 1. Clears all local state cleanly
+   // 2. Re-establishes a fresh WebSocket connection
+   // 3. Loads the restored state from the server
+   // 4. Avoids race conditions with sync events
+   console.log('[App] 🔄 Reloading page to load restored state...')
+   
+   // Small delay to ensure backend has finished updating
    setTimeout(() => {
+     console.log('[App] 🔄 Reloading now...')
      window.location.reload()
-   }, 500)
+   }, 800)
  }
```

---

## `backend/src/controllers/documentController.ts`

### Added: Detailed logging for version restore in-memory update

```diff
    try {
      const { docs } = await import('y-websocket/bin/utils');
      const activeDoc = docs.get(id) as Y.Doc | undefined;
      
      if (activeDoc) {
+       console.log(`[VERSION RESTORE] Updating in-memory document for ${id}`);
+       console.log(`[VERSION RESTORE] Current shapes in memory: ${activeDoc.getMap('shapes').size}`);
+       console.log(`[VERSION RESTORE] Restored version has ${versionDoc.getMap('shapes').size} shapes`);
+       
        activeDoc.transact(() => {
          const shapesMap = activeDoc.getMap('shapes');
          
          const existingShapes = Array.from(shapesMap.keys());
+         console.log(`[VERSION RESTORE] Clearing ${existingShapes.length} existing shapes`);
          existingShapes.forEach(key => shapesMap.delete(key));
          
          const restoredShapesMap = versionDoc.getMap('shapes');
+         let copiedCount = 0;
          restoredShapesMap.forEach((shape, shapeId) => {
            const shapeData = shape as Y.Map<any>;
            const newShape = new Y.Map();
            
            shapeData.forEach((value, key) => {
              newShape.set(key, value);
            });
            
            shapesMap.set(shapeId, newShape);
+           copiedCount++;
          });
+         
+         console.log(`[VERSION RESTORE] Copied ${copiedCount} shapes to in-memory document`);
        });
+       
+       console.log(`[VERSION RESTORE] ✅ In-memory document updated. Now has ${activeDoc.getMap('shapes').size} shapes`);
+     } else {
+       console.log(`[VERSION RESTORE] ⚠️  No active document found in memory for ${id}`);
      }
    } catch (error) {
-     console.error(`[VERSION RESTORE] Failed to update in-memory document:`, error);
+     console.error(`[VERSION RESTORE] ❌ Failed to update in-memory document:`, error);
    }
```

---

## Summary of Key Changes

1. **Event-driven sync** - Instead of full map diffs, only changed shape IDs sync
2. **Frame-based batching** - Changed from 50ms timeout to `requestAnimationFrame` 
3. **Faster cursor updates** - Reduced throttle from 100ms to 16ms
4. **Initial load handling** - Added `synced` event listener to properly load existing shapes
5. **Cleared event handling** - Prevented local store clears from wiping shared Yjs doc
6. **Version restore delay** - Increased from 500ms to 800ms to let backend finish
7. **Comprehensive logging** - Added detailed traces for debugging sync issues

---

## Known Regressions

- Version history restore can race with the new sync loop
- Initial shape loading occasionally misses persisted state
- See `PERFORMANCE_NOTES.md` for mitigation strategies
