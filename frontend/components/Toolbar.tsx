/**
 * Toolbar Component - Shape Selection Tools
 * 
 * WHY: Users need a way to select which shape type to create.
 * This toolbar provides buttons for each shape type.
 * 
 * WHAT: A horizontal toolbar with buttons for:
 * - Select tool (cursor)
 * - Rectangle
 * - Circle
 * - Line
 * - Text
 * 
 * HOW: Connected to Zustand store so Canvas knows which tool is active.
 * When you click a tool button, it updates the global store.
 */

'use client'

import { useCanvasStore } from '@/lib/canvasStore'
import type { ShapeType } from '@/types/canvas'

type Tool = 'select' | ShapeType

/**
 * Toolbar Component
 * 
 * WHY: This connects to the Zustand store to change the current tool.
 * The Canvas component reads from the same store to know what to do
 * when you click on it.
 */
export default function Toolbar() {
  // Get current tool from store AND the method to change it
  const currentTool = useCanvasStore((state) => state.currentTool)
  const setCurrentTool = useCanvasStore((state) => state.setCurrentTool)
  
  const handleToolClick = (tool: Tool) => {
    // Update the global store - Canvas will react to this change
    setCurrentTool(tool)
  }
  
  const buttonClass = (tool: Tool) =>
    `px-4 py-2 rounded transition-colors ${
      currentTool === tool
        ? 'bg-blue-600 text-white'
        : 'bg-white text-gray-700 hover:bg-gray-100'
    }`
  
  return (
    <div className="absolute top-4 left-1/2 transform -translate-x-1/2 bg-white shadow-lg rounded-lg p-2 flex gap-2">
      <button
        onClick={() => handleToolClick('select')}
        className={buttonClass('select')}
        title="Select Tool (V)"
      >
        <svg width="20" height="20" viewBox="0 0 20 20" fill="currentColor">
          <path d="M3 3 L3 17 L8 12 L11 17 L13 16 L10 11 L17 11 Z" />
        </svg>
      </button>
      
      <div className="w-px bg-gray-300" />
      
      <button
        onClick={() => handleToolClick('rect')}
        className={buttonClass('rect')}
        title="Rectangle (R)"
      >
        <svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2">
          <rect x="3" y="5" width="14" height="10" />
        </svg>
      </button>
      
      <button
        onClick={() => handleToolClick('circle')}
        className={buttonClass('circle')}
        title="Circle (C)"
      >
        <svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2">
          <circle cx="10" cy="10" r="7" />
        </svg>
      </button>
      
      <button
        onClick={() => handleToolClick('line')}
        className={buttonClass('line')}
        title="Line (L)"
      >
        <svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2">
          <line x1="3" y1="17" x2="17" y2="3" />
        </svg>
      </button>
      
      <button
        onClick={() => handleToolClick('text')}
        className={buttonClass('text')}
        title="Text (T)"
      >
        <svg width="20" height="20" viewBox="0 0 20 20" fill="currentColor">
          <text x="10" y="15" textAnchor="middle" fontSize="16" fontWeight="bold">T</text>
        </svg>
      </button>
    </div>
  )
}

