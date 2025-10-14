/**
 * Home Page - Canvas Testing Environment
 * 
 * WHY: This page lets you test all canvas features including REAL-TIME COLLABORATION!
 * It's a playground to try out drawing, selecting, moving, deleting, and collaborating.
 * 
 * WHAT: Shows the Canvas component with a Toolbar, ConnectionStatus, and PresenceList.
 * 
 * PHASE 3: Now includes real-time collaboration features!
 */

'use client'

import { useState } from 'react'
import Canvas from '@/components/Canvas'
import Toolbar from '@/components/Toolbar'
import ConnectionStatus from '@/components/ConnectionStatus'
import PresenceList from '@/components/PresenceList'

export default function Home() {
  const [showPresence, setShowPresence] = useState(false)
  
  return (
    <main className="relative w-screen h-screen overflow-hidden bg-gray-900">
      {/* Header with Connection Status */}
      <div className="absolute top-0 left-0 right-0 bg-gray-800 border-b border-gray-700 px-4 py-2 z-10 flex items-center justify-between">
        <div>
          <h1 className="text-white font-semibold">
            CollabCanvas - Phase 3: Real-Time Collaboration! 🎉
          </h1>
          <p className="text-gray-400 text-sm">
            Open multiple browser windows to test collaboration! See instructions below.
          </p>
        </div>
        
        <div className="flex items-center gap-3">
          <button
            onClick={() => setShowPresence(!showPresence)}
            className="text-white text-sm px-3 py-1 bg-gray-700 hover:bg-gray-600 rounded"
          >
            {showPresence ? 'Hide' : 'Show'} Users
          </button>
          {/* Connection status will be wired up when Canvas exports it */}
          <div className="text-white text-xs">
            ✅ Connected (mock)
          </div>
        </div>
      </div>

      {/* Toolbar */}
      <div className="absolute top-16 left-0 right-0 flex justify-center z-10">
        <Toolbar />
      </div>

      {/* Canvas - fills the screen */}
      <div className="w-full h-full pt-16">
        <Canvas />
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
