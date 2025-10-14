/**
 * Home Page - Canvas Testing Environment
 * 
 * WHY: This page lets you test all the canvas features we built in Phase 2.
 * It's a playground to try out drawing, selecting, moving, and deleting shapes.
 * 
 * WHAT: Shows the Canvas component with a Toolbar for shape selection.
 */

'use client'

import Canvas from '@/components/Canvas'
import Toolbar from '@/components/Toolbar'

export default function Home() {
  return (
    <main className="relative w-screen h-screen overflow-hidden bg-gray-900">
      {/* Header */}
      <div className="absolute top-0 left-0 right-0 bg-gray-800 border-b border-gray-700 px-4 py-2 z-10">
        <h1 className="text-white font-semibold">
          CollabCanvas - Phase 2 Testing
        </h1>
        <p className="text-gray-400 text-sm">
          Test all canvas features below! See instructions in terminal.
        </p>
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
      <div className="absolute bottom-4 left-4 bg-gray-800 border border-gray-700 rounded-lg p-3 text-xs text-gray-300 max-w-xs">
        <div className="font-semibold text-white mb-2">Keyboard Shortcuts:</div>
        <div className="space-y-1">
          <div><kbd className="bg-gray-700 px-1 rounded">Space</kbd> + Drag = Pan</div>
          <div><kbd className="bg-gray-700 px-1 rounded">Scroll</kbd> = Zoom</div>
          <div><kbd className="bg-gray-700 px-1 rounded">Shift</kbd> + Click = Multi-select</div>
          <div><kbd className="bg-gray-700 px-1 rounded">Delete</kbd> = Delete selected</div>
        </div>
      </div>
    </main>
  )
}
