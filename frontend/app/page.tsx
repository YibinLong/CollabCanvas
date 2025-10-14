/**
 * Home Page - Canvas Testing Environment
 * 
 * WHY: This page lets you test all canvas features including REAL-TIME COLLABORATION!
 * It's a playground to try out drawing, selecting, moving, deleting, and collaborating.
 * 
 * WHAT: Shows the Canvas component with a Toolbar, UserAvatars showing live presence.
 * Features include real-time collaboration and secure authentication.
 */

'use client'

import { useEffect, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import Canvas from '@/components/Canvas'
import Toolbar from '@/components/Toolbar'
import UserAvatars from '@/components/UserAvatars'
import { useAuth } from '@/lib/AuthContext'
import { useYjsSync } from '@/lib/useYjsSync'
import { usePresence } from '@/lib/usePresence'

export default function Home() {
  const router = useRouter()
  const { user, userMetadata, loading, logout } = useAuth()

  /**
   * Real-time collaboration setup
   * 
   * WHY: We need to set up Yjs sync and presence at the page level
   * so we can display user avatars in the header while Canvas uses
   * the same presence data for cursor tracking.
   * 
   * NOTE: These hooks must be called unconditionally (React rules)
   * even if user is not logged in yet. The hooks handle null user gracefully.
   */
  const documentId = 'test-document-123'
  const { connected, status, provider } = useYjsSync(documentId, undefined, !!user)
  
  // Create currentUser object from authenticated user
  const currentUser = useMemo(() => {
    if (!user) {
      return {
        id: 'anonymous',
        name: 'Anonymous',
        color: '#9ca3af',
      }
    }
    
    return {
      id: user.id,
      name: userMetadata?.name || user.email || 'User',
      color: '#3b82f6',
    }
  }, [user, userMetadata])
  
  // Get presence data (users and cursor update function)
  const { users, updateCursor } = usePresence(provider, currentUser)

  /**
   * Protected Route Logic
   * 
   * WHY: Only logged-in users should access the canvas
   * 
   * WHAT: If user is not logged in, redirect to login page
   */
  useEffect(() => {
    if (!loading && !user) {
      router.push('/login')
    }
  }, [user, loading, router])

  /**
   * Handle Logout
   * 
   * WHY: User needs a way to sign out
   */
  const handleLogout = async () => {
    try {
      await logout()
      router.push('/login')
    } catch (error) {
      console.error('Logout error:', error)
    }
  }

  // Show loading state while checking authentication
  if (loading) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="text-white text-xl">Loading...</div>
      </div>
    )
  }

  // Don't render canvas if not authenticated
  if (!user) {
    return null
  }
  
  return (
    <main className="relative w-screen h-screen overflow-hidden bg-gray-900">
      {/* Header with Connection Status */}
      <div className="absolute top-0 left-0 right-0 bg-gray-800 border-b border-gray-700 px-4 py-2 z-10 flex items-center justify-between">
        <div>
          <h1 className="text-white font-semibold">
            CollabCanvas
          </h1>
          <p className="text-gray-400 text-sm">
            Logged in as: <span className="text-blue-400">{user.email}</span>
          </p>
        </div>
        
        <div className="flex items-center gap-4">
          {/* Figma-style user avatars showing who's present */}
          <UserAvatars users={users} currentUserId={currentUser.id} />
          
          <button
            onClick={handleLogout}
            className="text-white text-sm px-3 py-1 bg-red-600 hover:bg-red-700 rounded"
            data-testid="logout-button"
          >
            Logout
          </button>
          
          {/* Connection status indicator */}
          <div className={`text-xs flex items-center gap-1 ${connected ? 'text-green-400' : 'text-red-400'}`}>
            <div className={`w-2 h-2 rounded-full ${connected ? 'bg-green-400' : 'bg-red-400'}`} />
            {connected ? 'Connected' : 'Disconnected'}
          </div>
        </div>
      </div>

      {/* Toolbar */}
      <div className="absolute top-16 left-0 right-0 flex justify-center z-10">
        <Toolbar />
      </div>

      {/* Canvas - fills the screen, pass presence props */}
      <div className="w-full h-full pt-16">
        <Canvas 
          provider={provider}
          users={users}
          updateCursor={updateCursor}
          currentUser={currentUser}
        />
      </div>

      {/* Help Panel */}
      <div className="absolute bottom-4 left-4 bg-gray-800 border border-gray-700 rounded-lg p-3 text-xs text-gray-300 max-w-md">
        <div className="font-semibold text-white mb-2">🎮 Controls:</div>
        <div className="space-y-1 mb-3">
          <div><kbd className="bg-gray-700 px-1 rounded">Space</kbd> + Drag = Pan</div>
          <div><kbd className="bg-gray-700 px-1 rounded">Scroll</kbd> = Zoom</div>
          <div><kbd className="bg-gray-700 px-1 rounded">Shift</kbd> + Click = Multi-select</div>
          <div><kbd className="bg-gray-700 px-1 rounded">Delete</kbd> = Delete selected</div>
        </div>
        
        <div className="font-semibold text-white mb-2">🌐 Test Collaboration:</div>
        <div className="space-y-1 text-xs">
          <div className="text-green-400">1. Open this page in 2+ browser windows</div>
          <div className="text-green-400">2. Draw shapes in one window</div>
          <div className="text-green-400">3. Watch them appear in other windows!</div>
          <div className="text-green-400">4. Move your cursor to see it in other windows</div>
        </div>
      </div>
    </main>
  )
}
