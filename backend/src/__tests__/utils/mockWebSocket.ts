/**
 * Mock WebSocket Utilities for Backend Testing
 * 
 * Backend tests need to mock WebSocket server and client connections.
 */

import { EventEmitter } from 'events'
import * as Y from 'yjs'

/**
 * Mock WebSocket connection (server-side)
 * 
 * WHY: The WebSocket server sees client connections as 'ws' objects.
 * This mock simulates a client connection from the server's perspective.
 * 
 * USAGE:
 *   const client = new MockWebSocketConnection()
 *   client.on('message', (data) => console.log(data))
 *   client.simulateMessage('Hello from client')
 */
export class MockWebSocketConnection extends EventEmitter {
  public readyState: number = 1 // OPEN
  public sentMessages: any[] = []
  public isAlive: boolean = true
  
  /**
   * Send a message to the client
   */
  send(data: any, callback?: (err?: Error) => void) {
    if (this.readyState !== 1) { // 1 = OPEN
      throw new Error('WebSocket is not open. readyState: ' + this.readyState)
    }
    this.sentMessages.push(data)
    if (callback) callback()
  }
  
  /**
   * Simulate receiving a message from the client
   */
  simulateMessage(data: any) {
    this.emit('message', data)
  }
  
  /**
   * Simulate client disconnecting
   */
  simulateClose(code = 1000, reason = 'Normal closure') {
    this.readyState = 3 // CLOSED
    this.emit('close', code, reason)
  }
  
  /**
   * Simulate an error
   */
  simulateError(error: Error) {
    this.emit('error', error)
  }
  
  /**
   * Close the connection
   */
  close(code?: number, reason?: string) {
    this.simulateClose(code, reason)
  }
  
  /**
   * Ping the client (for keep-alive)
   */
  ping() {
    this.isAlive = true
  }
  
  /**
   * Handle pong from client
   */
  pong() {
    this.isAlive = true
  }
}

/**
 * Mock WebSocket Server
 * 
 * WHY: Tests need to simulate a WebSocket server without starting a real server.
 * This mock tracks connected clients and can broadcast messages.
 * 
 * USAGE:
 *   const server = new MockWebSocketServer()
 *   const client1 = server.createClient()
 *   const client2 = server.createClient()
 *   server.broadcast('Hello all')
 */
export class MockWebSocketServer extends EventEmitter {
  public clients: Set<MockWebSocketConnection> = new Set()
  public isRunning: boolean = false
  
  /**
   * Start the server
   */
  start() {
    this.isRunning = true
    this.emit('listening')
  }
  
  /**
   * Stop the server
   */
  stop() {
    this.isRunning = false
    this.clients.forEach(client => client.close())
    this.clients.clear()
    this.emit('close')
  }
  
  /**
   * Create a mock client connection
   */
  createClient(): MockWebSocketConnection {
    const client = new MockWebSocketConnection()
    this.clients.add(client)
    
    // Remove client when it disconnects
    client.on('close', () => {
      this.clients.delete(client)
    })
    
    this.emit('connection', client)
    return client
  }
  
  /**
   * Broadcast a message to all clients
   */
  broadcast(data: any, excludeClient?: MockWebSocketConnection) {
    this.clients.forEach(client => {
      if (client !== excludeClient && client.readyState === 1) {
        client.send(data)
      }
    })
  }
  
  /**
   * Get the number of connected clients
   */
  get clientCount(): number {
    return this.clients.size
  }
}

/**
 * Test helper for Yjs WebSocket sync
 * 
 * WHY: Testing Yjs sync requires setting up clients and documents.
 * This helper creates everything needed for a sync test.
 * 
 * USAGE:
 *   const { server, client1, client2, doc1, doc2 } = createYjsSyncTest()
 *   // Modify doc1
 *   doc1.getMap('shapes').set('shape1', data)
 *   // Verify doc2 receives the update
 *   await waitForSync()
 *   expect(doc2.getMap('shapes').get('shape1')).toEqual(data)
 */
export function createYjsSyncTest() {
  const server = new MockWebSocketServer()
  server.start()
  
  const doc1 = new Y.Doc()
  const doc2 = new Y.Doc()
  
  const client1 = server.createClient()
  const client2 = server.createClient()
  
  // Set up basic sync: when a doc updates, broadcast to other clients
  doc1.on('update', (update: Uint8Array) => {
    server.broadcast(update, client1)
  })
  
  doc2.on('update', (update: Uint8Array) => {
    server.broadcast(update, client2)
  })
  
  // When clients receive updates, apply to their docs
  client1.on('message', (data: Uint8Array) => {
    Y.applyUpdate(doc1, data)
  })
  
  client2.on('message', (data: Uint8Array) => {
    Y.applyUpdate(doc2, data)
  })
  
  return { server, client1, client2, doc1, doc2 }
}

/**
 * Wait for Yjs sync to complete
 * 
 * WHY: Yjs updates are asynchronous. This waits for all updates to propagate.
 */
export async function waitForSync(timeout = 1000): Promise<void> {
  return new Promise((resolve) => {
    setTimeout(resolve, timeout)
  })
}

