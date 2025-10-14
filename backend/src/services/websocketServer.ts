/**
 * WebSocket Server for Real-Time Collaboration
 * 
 * WHY: This server enables real-time synchronization of Yjs documents across
 * multiple clients. When one user makes a change, it's instantly broadcast to
 * all other users working on the same document.
 * 
 * WHAT IT DOES:
 * 1. Creates a WebSocket server using y-websocket library
 * 2. Manages document "rooms" (one room per document ID)
 * 3. Handles client connections and disconnections
 * 4. Broadcasts Yjs updates to all clients in a room
 * 5. Persists document snapshots to database
 * 
 * HOW TO USE:
 * import { createWebSocketServer } from './services/websocketServer'
 * const wss = createWebSocketServer(httpServer)
 */

import * as http from 'http'
import WebSocket from 'ws'
import { URL } from 'url'
type ManagedWebSocket = WebSocket & { 
  isAlive?: boolean
  userId?: string  // Store authenticated user ID
  userEmail?: string  // Store user email for presence
}

import * as Y from 'yjs'
// @ts-ignore - y-websocket doesn't have type definitions
import { setupWSConnection } from 'y-websocket/bin/utils'
import { verifyToken } from '../utils/supabase'

/**
 * WebSocket Server Configuration
 */
interface WebSocketServerConfig {
  // Ping interval to keep connections alive (milliseconds)
  pingInterval?: number
  // Timeout for pong response (milliseconds)
  pongTimeout?: number
  // Enable persistence to database
  enablePersistence?: boolean
  // Callback for authentication (returns user ID if valid)
  authenticate?: (token: string) => Promise<string | null>
}

/**
 * Room data structure
 * 
 * WHY: Each document has its own "room" where clients collaborate.
 * We track the Yjs document and all connected clients.
 */
interface Room {
  name: string
  doc: Y.Doc
  clients: Set<WebSocket>
  lastUpdate: number
}

/**
 * Global rooms map
 * WHY: We need to track all active rooms and their documents
 */
const rooms = new Map<string, Room>()

/**
 * Create WebSocket Server
 * 
 * WHY: This sets up the WebSocket server that handles all real-time
 * collaboration. It uses the y-websocket protocol for efficient Yjs sync.
 * 
 * @param httpServer - The HTTP server to attach WebSocket to
 * @param config - Configuration options
 * @returns WebSocket.Server instance
 */
export function createWebSocketServer(
  httpServer: http.Server,
  config: WebSocketServerConfig = {}
): WebSocket.Server {
  // Default configuration
  const {
    pingInterval = 30000, // 30 seconds
    pongTimeout = 5000, // 5 seconds
    enablePersistence = false,
    authenticate,
  } = config

  /**
   * Create WebSocket server attached to HTTP server
   * 
   * WHY: We attach to an existing HTTP server so we can share the same port.
   * This is more efficient than running separate servers.
   */
  const wss = new WebSocket.Server({
    server: httpServer,
    // Allow CORS for WebSocket connections
    verifyClient: (info, callback) => {
      // For now, allow all connections
      // In production, check origin against whitelist
      callback(true)
    },
  })

  console.log('[WebSocket] Server created')

  /**
   * Handle new client connections with authentication (PR #23 - UPDATED!)
   * 
   * WHY: The y-websocket package provides a `setupWSConnection` utility
   * that properly handles all the protocol details, including:
   * - Sync messages (document updates)
   * - Awareness messages (presence/cursors)
   * - Room management
   * - Proper encoding/decoding
   * 
   * PHASE 5: Now includes JWT authentication for WebSocket connections ✅
   */
  wss.on('connection', async (ws: WebSocket, request: http.IncomingMessage) => {
    const client = ws as ManagedWebSocket
    client.isAlive = true

    /**
     * Authenticate the connection (PR #23)
     * 
     * WHY: Only logged-in users should be able to connect to WebSocket
     * and collaborate on documents.
     * 
     * HOW: Extract JWT token from query parameter and verify it
     */
    try {
      const fullUrl = `http://localhost${request.url || '/'}`
      const parsedUrl = new URL(fullUrl)
      const token = parsedUrl.searchParams.get('token')
      
      if (!token) {
        console.log('[WS] ❌ No token - connection rejected')
        ws.close(4401, 'Authentication required')
        return
      }

      // Verify JWT token
      const user = await verifyToken(token)
      
      // Attach user info to connection for presence
      client.userId = user.id
      client.userEmail = user.email || undefined
      
      console.log(`[WS] ✅ ${user.email} authenticated`)
    } catch (error) {
      console.error('[WS] ❌ Auth failed:', error instanceof Error ? error.message : 'Unknown error')
      ws.close(4403, 'Invalid or expired token')
      return
    }

    /**
     * Parse room name from URL
     * 
     * WHY: y-websocket clients send the room name in the URL path.
     * Example: ws://localhost:4000/test-document-123?token=...
     */
    const url = request.url || '/'
    const roomName = url.split('?')[0].slice(1) // Remove leading slash and query params
    
    if (!roomName) {
      console.log('[WS] ❌ No room specified')
      ws.close()
      return
    }

    /**
     * Get or create the Yjs document for this room
     */
    const room = getOrCreateRoom(roomName)
    
    /**
     * Track unique users (y-websocket creates 2 connections per user: sync + awareness)
     * We only want to log when a NEW user joins, not for each connection
     */
    const isNewUser = !Array.from(room.clients).some(
      (existingWs) => (existingWs as ManagedWebSocket).userId === client.userId
    )
    
    room.clients.add(ws)
    
    // Count unique users (not connections)
    const uniqueUsers = new Set(
      Array.from(room.clients).map((ws) => (ws as ManagedWebSocket).userId)
    )
    
    if (isNewUser) {
      console.log(`[WS] 👤 ${client.userEmail} joined ${roomName} (${uniqueUsers.size} users online)`)
    }
    
    /**
     * Use y-websocket's setupWSConnection utility
     * 
     * This handles all the protocol details:
     * - Initial sync (sending current document state)
     * - Applying incoming updates
     * - Broadcasting to other clients
     * - Awareness (presence) updates
     */
    setupWSConnection(ws, request, { docName: roomName, gc: true })

    /**
     * Handle disconnection
     */
    ws.on('close', () => {
      room.clients.delete(ws)
      
      // Check if this was the user's last connection
      const userStillConnected = Array.from(room.clients).some(
        (existingWs) => (existingWs as ManagedWebSocket).userId === client.userId
      )
      
      const remainingUsers = new Set(
        Array.from(room.clients).map((ws) => (ws as ManagedWebSocket).userId)
      )
      
      if (!userStillConnected && client.userEmail) {
        console.log(`[WS] 👋 ${client.userEmail} left ${roomName} (${remainingUsers.size} users online)`)
      }
      
      if (room.clients.size === 0) {
        console.log(`[WS] 📭 Room ${roomName} is now empty`)
      }
    })

    ws.on('pong', () => {
      client.isAlive = true
    })

    /**
     * Handle errors
     */
    ws.on('error', (error) => {
      console.error('[WS] ⚠️  Connection error:', error.message)
    })
  })

  /**
   * Keep-alive interval
   * 
   * WHY: Ping all clients regularly. If they don't respond, close the connection.
   * This prevents zombie connections from accumulating.
   */
  const keepAliveInterval = setInterval(() => {
    wss.clients.forEach((ws) => {
      const client = ws as ManagedWebSocket
      if (client.isAlive === false) {
        console.log('[WS] ⚠️  Terminating inactive connection')
        client.terminate()
        return
      }

      client.isAlive = false
      client.ping()
    })
  }, pingInterval)

  /**
   * Cleanup on server close
   */
  wss.on('close', () => {
    clearInterval(keepAliveInterval)
    console.log('[WS] Server closed')
  })

  return wss
}

/**
 * Get or create a room
 * 
 * WHY: Rooms are created on-demand when the first client joins.
 * This saves memory - we only have rooms for active documents.
 * 
 * @param roomName - Unique room identifier (usually document ID)
 * @returns Room object
 */
function getOrCreateRoom(roomName: string): Room {
  let room = rooms.get(roomName)
  
  if (!room) {
    console.log(`[WS] 🚪 Created room: ${roomName}`)
    
    room = {
      name: roomName,
      doc: new Y.Doc(),
      clients: new Set(),
      lastUpdate: Date.now(),
    }
    
    rooms.set(roomName, room)
    
    // Load persisted document state if available
    // This will be implemented in Phase 4 (Persistence)
    // await loadDocument(roomName, room.doc)
  }
  
  return room
}

/**
 * Broadcast message to all clients in a room except sender
 * 
 * WHY: When one client makes a change, all other clients need to see it.
 * We send the update to everyone in the room except the originator.
 * 
 * @param room - The room to broadcast to
 * @param message - The message to send
 * @param sender - The client who sent the message (exclude from broadcast)
 */
function broadcastToRoom(room: Room, message: Buffer, sender: WebSocket) {
  room.clients.forEach((client) => {
    // Don't send back to the sender
    if (client !== sender && client.readyState === WebSocket.OPEN) {
      client.send(message)
    }
  })
}

/**
 * Create a y-websocket sync message
 * 
 * WHY: y-websocket has a specific message format. This helper creates
 * properly formatted messages.
 * 
 * @param syncType - Sync message type (0 = request, 1 = response, 2 = update)
 * @param data - The actual data (Yjs update)
 * @returns Formatted message buffer
 */
function createSyncMessage(syncType: number, data: Uint8Array): Buffer {
  const message = new Uint8Array(data.length + 2)
  message[0] = 0 // Message type: sync
  message[1] = syncType // Sync type
  message.set(data, 2) // Data starts at index 2
  return Buffer.from(message)
}

/**
 * Get room statistics
 * 
 * WHY: Useful for monitoring and debugging. Shows active rooms and client counts.
 */
export function getServerStats() {
  const stats = {
    roomCount: rooms.size,
    rooms: Array.from(rooms.values()).map((room) => ({
      name: room.name,
      clientCount: room.clients.size,
      lastUpdate: new Date(room.lastUpdate).toISOString(),
    })),
  }
  
  return stats
}

/**
 * Close a room and disconnect all clients
 * 
 * WHY: Useful for admin operations (force-close a document, etc.)
 */
export function closeRoom(roomName: string) {
  const room = rooms.get(roomName)
  
  if (room) {
    // Close all client connections
    room.clients.forEach((client) => {
      client.close(1000, 'Room closed by server')
    })
    
    // Remove room
    rooms.delete(roomName)
    
    console.log(`[WS] 🚪 Room ${roomName} closed`)
  }
}

