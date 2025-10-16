/**
 * Yjs Sync Hook
 * 
 * WHY: This hook connects our Zustand store to Yjs for real-time collaboration.
 * When one user makes a change, it needs to sync to all other users. Yjs handles
 * the complex synchronization logic, and this hook bridges Zustand and Yjs.
 * 
 * WHAT IT DOES:
 * 1. Creates a Yjs document (Y.Doc) to store collaborative data
 * 2. Syncs changes FROM Zustand TO Yjs (when local user makes changes)
 * 3. Syncs changes FROM Yjs TO Zustand (when remote users make changes)
 * 4. Manages WebSocket connection to the collaboration server
 * 
 * HOW TO USE:
 * In your Canvas component:
 *   const { connected, error } = useYjsSync(documentId)
 */

import { useEffect, useRef, useState } from 'react'
import * as Y from 'yjs'
import { WebsocketProvider } from 'y-websocket'
import { useCanvasStore } from './canvasStore'
import type { Shape } from '@/types/canvas'
import { getAuthToken } from './supabase'

/**
 * Connection status type
 * 
 * WHY: We show users if they're connected to the collaboration server.
 * This helps them know if their changes are being synced.
 */
export type ConnectionStatus = 'disconnected' | 'connecting' | 'connected' | 'error'

/**
 * Hook return value interface
 */
interface UseYjsSyncReturn {
  connected: boolean
  status: ConnectionStatus
  error: string | null
  doc: Y.Doc | null
  provider: WebsocketProvider | null
}

/**
 * useYjsSync Hook
 * 
 * @param documentId - The unique ID of the document to collaborate on
 * @param wsUrl - WebSocket server URL (defaults to env variable)
 * @param enabled - Whether to enable sync (useful for testing)
 */
export function useYjsSync(
  documentId: string,
  wsUrl?: string,
  enabled: boolean = true
): UseYjsSyncReturn {
  // Grab stable action references from Zustand
  const addShape = useCanvasStore((state) => state.addShape)
  const updateShape = useCanvasStore((state) => state.updateShape)
  const removeShape = useCanvasStore((state) => state.removeShape)

  // State for connection status
  const [status, setStatus] = useState<ConnectionStatus>('disconnected')
  const [error, setError] = useState<string | null>(null)
  
  // Refs to hold Yjs document and WebSocket provider
  // WHY refs: These objects persist across renders but don't trigger re-renders
  const docRef = useRef<Y.Doc | null>(null)
  const providerRef = useRef<WebsocketProvider | null>(null)
  
  // Flag to prevent sync loops (when Yjs updates Zustand, don't sync back to Yjs)
  const isSyncingFromYjs = useRef(false)

  useEffect(() => {
    if (!enabled) {
      console.log('[Yjs] Sync disabled (user not logged in)')
      return
    }

    /**
     * STEP 0: Initialize with authentication (PR #23 - NEW!)
     * 
     * WHY: We need to pass the JWT token to authenticate the WebSocket connection
     */
    const initializeConnection = async () => {
      /**
       * STEP 1: Create Yjs document
       * 
       * WHY: Y.Doc is the container for all collaborative data.
       * We use Y.Map to store shapes because it syncs well across clients.
       */
      const doc = new Y.Doc()
      docRef.current = doc
      
      // Get the shapes map (creates it if it doesn't exist)
      const shapesMap = doc.getMap('shapes')

      const addOrUpdateShapeFromRemote = (id: string, shapeData: Shape) => {
        const currentShapes = useCanvasStore.getState().shapes
        if (currentShapes.has(id)) {
          updateShape(id, shapeData)
        } else {
          addShape(shapeData)
        }
      }

      /**
       * STEP 2: Set up WebSocket provider with authentication (PR #23 - UPDATED!)
       * 
       * WHY: The provider connects our Yjs document to the server.
       * It automatically sends updates when we change the document,
       * and receives updates from other users.
       * 
       * Authentication: Uses JWT token for secure WebSocket connections
       * 
       * HOW IT WORKS:
       * - wsUrl: Server address (e.g., 'ws://localhost:4000')
       * - documentId: Room name (all users in the same room share the same document)
       * - doc: The Yjs document to sync
       * - params: Query parameters including auth token
       */
      const serverUrl = wsUrl || process.env.NEXT_PUBLIC_WS_URL || 'ws://localhost:4000'
      
      // Sanity check: Warn if environment variable is missing
      if (!process.env.NEXT_PUBLIC_WS_URL && !wsUrl) {
        console.warn(
          '[Yjs] ⚠️  NEXT_PUBLIC_WS_URL is not set! Using fallback: ws://localhost:4000\n' +
          '   This may cause sync issues if accessing via 127.0.0.1 or LAN IP.\n' +
          '   Fix: Add NEXT_PUBLIC_WS_URL=ws://localhost:4000 to frontend/.env.local'
        )
      }
      
      // Get JWT token for authentication
      const token = await getAuthToken()
      
      if (!token) {
        console.error('[Yjs] ❌ No auth token available')
        setStatus('error')
        setError('Authentication required')
        return null
      }
      
      console.log('[Yjs] 🔌 Connecting to', documentId)

      // Create provider with authenticated URL
      // Note: We pass the base URL to WebsocketProvider, but it constructs the full URL internally
      const provider = new WebsocketProvider(
        serverUrl, 
        documentId, 
        doc, 
        {
          // Options for the WebSocket connection
          connect: true, // Connect immediately
          // Pass token as query parameter
          params: { token }
        }
      )
      providerRef.current = provider
      
      return { doc, shapesMap, provider, addOrUpdateShapeFromRemote }
    }

    // Start async initialization
    initializeConnection().then((result) => {
      if (!result) return // Failed to initialize
      
      const { doc, shapesMap, provider, addOrUpdateShapeFromRemote } = result

    /**
     * STEP 3: Listen to connection status events
     * 
     * WHY: Users need to know if they're connected. If disconnected,
     * their changes won't sync until they reconnect.
     */
    provider.on('status', (event: { status: string }) => {
      if (event.status === 'connected') {
        console.log('[Yjs] ✅ Connected')
        setStatus('connected')
        setError(null)
      } else if (event.status === 'connecting') {
        setStatus('connecting')
      } else {
        setStatus('disconnected')
      }
    })

    provider.on('connection-error', (err: Error) => {
      console.error('[Yjs] Connection error:', err)
      setStatus('error')
      setError(err.message || 'Failed to connect to collaboration server')
    })

    // Set initial connecting status
    setStatus('connecting')

    /**
     * STEP 4: Sync FROM Yjs TO Zustand
     * 
     * WHY: When other users make changes, Yjs receives updates.
     * We need to apply those updates to our Zustand store so our UI updates.
     * 
     * HOW: Listen for 'observeDeep' on the shapes map. This fires whenever
     * any shape is added, updated, or deleted.
     */
    const handleYjsUpdate = (events: Y.YEvent<any>[], transaction: Y.Transaction) => {
      // Ignore updates from our own local changes (prevents sync loops)
      if (transaction.local) return
      
      // Set flag to prevent syncing back to Yjs
      isSyncingFromYjs.current = true

      const shapesToRefresh = new Set<string>()

      events.forEach((event) => {
        if (event.target === shapesMap) {
          // Handle added or updated shapes
          event.changes.keys.forEach((change, key) => {
            if (change.action === 'add' || change.action === 'update') {
              const yjsShape = shapesMap.get(key) as Y.Map<any>
              if (yjsShape) {
                // Convert Y.Map to plain object
                const shapeData = yjsMapToObject(yjsShape) as Shape
                
                // Update or add to Zustand store
                addOrUpdateShapeFromRemote(key, shapeData)
              }
            } else if (change.action === 'delete') {
              // Remove from Zustand store
              removeShape(key)
            }
          })
        } else if (event.path.length > 0) {
          const shapeId = event.path[0]
          if (typeof shapeId === 'string') {
            shapesToRefresh.add(shapeId)
          }
        }
      })

      shapesToRefresh.forEach((shapeId) => {
        const yjsShape = shapesMap.get(shapeId) as Y.Map<any> | undefined
        if (!yjsShape) {
          removeShape(shapeId)
          return
        }

        const shapeData = yjsMapToObject(yjsShape) as Shape
        addOrUpdateShapeFromRemote(shapeId, shapeData)
      })

      // Reset flag after sync completes
      isSyncingFromYjs.current = false
    }

    shapesMap.observeDeep(handleYjsUpdate)

    /**
     * STEP 5: Sync FROM Zustand TO Yjs (with throttling for performance)
     * 
     * WHY: When the local user makes changes, we need to sync them to Yjs
     * so other users can see the changes.
     * 
     * OPTIMIZATION: We throttle updates to reduce network traffic during
     * rapid operations like dragging and resizing.
     * 
     * HOW: Subscribe to Zustand store changes and update Yjs accordingly.
     */
    let syncTimeout: NodeJS.Timeout | null = null
    const pendingUpdates = new Set<string>()
    
    const syncToYjs = () => {
      if (isSyncingFromYjs.current) return
      
      const state = useCanvasStore.getState()
      
      pendingUpdates.forEach((shapeId) => {
        const shape = state.shapes.get(shapeId)
        
        if (shape) {
          // Shape exists - update or create
          let yjsShape = shapesMap.get(shapeId) as Y.Map<any>
          if (!yjsShape) {
            yjsShape = new Y.Map()
            shapesMap.set(shapeId, yjsShape)
          }
          
          // Update all properties
          Object.entries(shape).forEach(([key, value]) => {
            if (value !== undefined) {
              yjsShape.set(key, value)
            }
          })
        } else {
          // Shape was deleted
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

    /**
     * STEP 6: Cleanup on unmount
     * 
     * WHY: When the component unmounts, we need to disconnect from the
     * server and clean up event listeners to prevent memory leaks.
     */
      return () => {
        // Clear any pending sync
        if (syncTimeout) {
          clearTimeout(syncTimeout)
          // Sync one final time before disconnecting
          syncToYjs()
        }
        
        shapesMap.unobserveDeep(handleYjsUpdate)
        unsubscribe()
        provider.disconnect()
        provider.destroy()
        doc.destroy()
      }
    }).catch((error) => {
      console.error('[Yjs] ❌ Initialization error:', error.message)
      setStatus('error')
      setError(error.message || 'Failed to initialize collaboration')
    })

    // Cleanup function for the effect itself
    return () => {
      // Cleanup will be handled by the inner return function
      if (providerRef.current) {
        providerRef.current.disconnect()
        providerRef.current.destroy()
      }
      if (docRef.current) {
        docRef.current.destroy()
      }
    }
  }, [documentId, wsUrl, enabled, addShape, updateShape, removeShape])

  return {
    connected: status === 'connected',
    status,
    error,
    doc: docRef.current,
    provider: providerRef.current,
  }
}

/**
 * Helper: Convert Y.Map to plain JavaScript object
 * 
 * WHY: Yjs uses special Y.Map objects for synchronization.
 * We need to convert them to plain objects for use in React/Zustand.
 */
function yjsMapToObject(ymap: Y.Map<any>): Record<string, any> {
  const obj: Record<string, any> = {}
  ymap.forEach((value, key) => {
    obj[key] = value
  })
  return obj
}

/**
 * Helper: Check if a shape has changed
 * 
 * WHY: We only want to sync when shapes actually change.
 * This prevents unnecessary network traffic and update loops.
 */
function shapeHasChanged(oldShape: Shape, newShape: Shape): boolean {
  // Simple comparison - in production you might want a deep comparison
  const keys = Object.keys(newShape) as (keyof Shape)[]
  
  for (const key of keys) {
    if (oldShape[key] !== newShape[key]) {
      return true
    }
  }
  
  return false
}

