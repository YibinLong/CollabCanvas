/**
 * Mock WebSocket Client for Testing
 * 
 * These utilities help test real-time features without needing a real WebSocket server.
 * 
 * WHY: WebSocket connections are asynchronous and require a server.
 * These mocks simulate WebSocket behavior in a synchronous, controlled way.
 */

/**
 * Mock WebSocket implementation
 * 
 * WHY: The real WebSocket API is complex and requires a server.
 * This mock implements the same interface but works without a network.
 * 
 * USAGE:
 *   const ws = new MockWebSocket('ws://test')
 *   ws.onopen = () => console.log('Connected')
 *   ws.simulateOpen() // Trigger connection
 *   ws.send('Hello') // Send a message
 *   ws.simulateMessage('Response') // Simulate receiving a message
 */
export class MockWebSocket {
  public readyState: number = WebSocket.CONNECTING
  public url: string
  public onopen: ((event: any) => void) | null = null
  public onclose: ((event: any) => void) | null = null
  public onerror: ((event: any) => void) | null = null
  public onmessage: ((event: any) => void) | null = null
  
  // Track sent messages for assertions in tests
  public sentMessages: any[] = []
  
  constructor(url: string) {
    this.url = url
  }
  
  /**
   * Simulate sending a message
   * WHY: In tests, we want to verify what messages were sent
   */
  send(data: any) {
    if (this.readyState !== WebSocket.OPEN) {
      throw new Error('WebSocket is not open')
    }
    this.sentMessages.push(data)
  }
  
  /**
   * Simulate the connection opening
   * WHY: Tests need to trigger connection events at specific times
   */
  simulateOpen() {
    this.readyState = WebSocket.OPEN
    if (this.onopen) {
      this.onopen({ type: 'open' })
    }
  }
  
  /**
   * Simulate receiving a message from the server
   * WHY: Tests need to verify how the app handles incoming messages
   */
  simulateMessage(data: any) {
    if (this.onmessage) {
      this.onmessage({ type: 'message', data })
    }
  }
  
  /**
   * Simulate the connection closing
   * WHY: Tests need to verify reconnection logic
   */
  simulateClose(code = 1000, reason = 'Normal closure') {
    this.readyState = WebSocket.CLOSED
    if (this.onclose) {
      this.onclose({ type: 'close', code, reason })
    }
  }
  
  /**
   * Simulate a connection error
   * WHY: Tests need to verify error handling
   */
  simulateError(error: any = new Error('Connection error')) {
    if (this.onerror) {
      this.onerror({ type: 'error', error })
    }
  }
  
  /**
   * Close the connection
   */
  close(code?: number, reason?: string) {
    this.simulateClose(code, reason)
  }
}

/**
 * Helper to create a mock WebSocket server for testing
 * 
 * WHY: Sometimes you need to test client-server interactions.
 * This creates a "server" that can respond to client messages.
 * 
 * USAGE:
 *   const server = createMockWebSocketServer()
 *   const client = server.createClient()
 *   client.send('ping')
 *   expect(server.receivedMessages).toContain('ping')
 */
export class MockWebSocketServer {
  public clients: MockWebSocket[] = []
  public receivedMessages: any[] = []
  
  /**
   * Create a client connected to this server
   */
  createClient(url = 'ws://localhost:4000'): MockWebSocket {
    const client = new MockWebSocket(url)
    this.clients.push(client)
    
    // Override send to capture messages
    const originalSend = client.send.bind(client)
    client.send = (data: any) => {
      originalSend(data)
      this.receivedMessages.push(data)
    }
    
    // Auto-connect after a tick
    setTimeout(() => client.simulateOpen(), 0)
    
    return client
  }
  
  /**
   * Broadcast a message to all connected clients
   */
  broadcast(data: any) {
    this.clients.forEach(client => {
      if (client.readyState === WebSocket.OPEN) {
        // Simulate both sending (for tracking) and receiving (for message handler)
        client.sentMessages.push(data)
        client.simulateMessage(data)
      }
    })
  }
  
  /**
   * Close all client connections
   */
  closeAll() {
    this.clients.forEach(client => client.simulateClose())
    this.clients = []
  }
}

/**
 * Helper to wait for a WebSocket event
 * 
 * WHY: WebSocket events are asynchronous. This helper waits for
 * a specific event to occur before continuing the test.
 * 
 * USAGE:
 *   const ws = new MockWebSocket('ws://test')
 *   const openPromise = waitForWebSocketEvent(ws, 'open')
 *   ws.simulateOpen()
 *   await openPromise // Waits until 'open' event fires
 */
export function waitForWebSocketEvent(
  ws: MockWebSocket,
  eventType: 'open' | 'close' | 'message' | 'error',
  timeout = 5000
): Promise<any> {
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => {
      reject(new Error(`Timeout waiting for ${eventType} event`))
    }, timeout)
    
    const handler = (event: any) => {
      clearTimeout(timer)
      resolve(event)
    }
    
    switch (eventType) {
      case 'open':
        ws.onopen = handler
        break
      case 'close':
        ws.onclose = handler
        break
      case 'message':
        ws.onmessage = handler
        break
      case 'error':
        ws.onerror = handler
        break
    }
  })
}

