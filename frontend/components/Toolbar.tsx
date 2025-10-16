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
 * - Clear All (trash icon)
 * 
 * HOW: Connected to Zustand store so Canvas knows which tool is active.
 * When you click a tool button, it updates the global store.
 */

'use client'

import { useCanvasStore } from '@/lib/canvasStore'
import type { ShapeType } from '@/types/canvas'
import { useState } from 'react'

type Tool = 'select' | ShapeType

/**
 * Toolbar Component Props
 * 
 * WHY: Toolbar needs access to document ID and a callback to clear all shapes
 */
interface ToolbarProps {
  documentId?: string
  onClearAll?: () => void
}

/**
 * Toolbar Component
 * 
 * WHY: This connects to the Zustand store to change the current tool.
 * The Canvas component reads from the same store to know what to do
 * when you click on it.
 */
export default function Toolbar({ documentId, onClearAll }: ToolbarProps) {
  // Get current tool from store AND the method to change it
  const currentTool = useCanvasStore((state) => state.currentTool)
  const setCurrentTool = useCanvasStore((state) => state.setCurrentTool)
  const [isClearing, setIsClearing] = useState(false)
  
  /**
   * WHY: Track confirmation state for the Clear All button.
   * This creates a two-step process:
   * 1st click: Button changes to red "Confirm Delete?" 
   * 2nd click: Actually clears all shapes
   */
  const [confirmClear, setConfirmClear] = useState(false)
  
  const handleToolClick = (tool: Tool) => {
    // Clear any pending confirmation when switching tools
    // WHY: If user clicks another tool, they've changed their mind about clearing
    setConfirmClear(false)
    
    // Update the global store - Canvas will react to this change
    setCurrentTool(tool)
  }
  
  /**
   * Handle Clear All Shapes - Two-Click Confirmation Pattern
   * 
   * WHY: User clicks the trash button to delete all shapes at once.
   * This is destructive so we use a two-step confirmation.
   * 
   * HOW IT WORKS:
   * - First click: Button turns red "Confirm Delete?" → sets confirmClear to true
   * - Second click: Actually clears all shapes → calls onClearAll callback
   * - Clicking other tools cancels the confirmation
   * 
   * WHAT IT DOES:
   * 1. Calls the parent's onClearAll callback
   * 2. Parent (Canvas) handles the API call and Yjs sync
   * 3. All connected users see shapes removed in real-time
   */
  const handleClearAll = async () => {
    // If NOT in confirmation state, enter confirmation mode
    if (!confirmClear) {
      setConfirmClear(true)
      return
    }
    
    // If we're here, user clicked "Confirm Delete?" - actually clear now
    setConfirmClear(false) // Reset confirmation state
    
    if (onClearAll) {
      setIsClearing(true)
      try {
        await onClearAll()
      } catch (error) {
        console.error('Error clearing shapes:', error)
        alert('Failed to clear shapes. Please try again.')
      } finally {
        setIsClearing(false)
      }
    }
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
      
      {/* Divider before destructive action */}
      <div className="w-px bg-gray-300" />
      
      {/* Clear All Shapes Button - Two-Click Confirmation
          WHY: Allows users to delete all shapes at once from the canvas.
          This is a destructive action so we use two-click confirmation:
          1. First click: Button turns red "Confirm Delete?" with warning icon
          2. Second click: Actually clears all shapes
          3. Clicking other tools cancels the confirmation
          4. Disabled while operation is in progress
      */}
      <button
        onClick={handleClearAll}
        disabled={isClearing || !onClearAll}
        className={`px-4 py-2 rounded transition-colors flex items-center gap-1.5 ${
          isClearing || !onClearAll
            ? 'bg-gray-200 text-gray-400 cursor-not-allowed'
            : confirmClear
            ? 'bg-red-600 text-white hover:bg-red-700'
            : 'bg-red-50 text-red-600 hover:bg-red-100'
        }`}
        title={confirmClear ? 'Click again to confirm deletion' : 'Clear All Shapes (Delete Everything)'}
      >
        {isClearing ? (
          // Loading state
          <svg 
            className="animate-spin"
            width="20" 
            height="20" 
            viewBox="0 0 20 20" 
            fill="none" 
            stroke="currentColor" 
            strokeWidth="2"
          >
            <circle cx="10" cy="10" r="7" strokeDasharray="32" strokeDashoffset="8" />
          </svg>
        ) : confirmClear ? (
          // Confirmation state - Warning icon (high quality triangle with exclamation)
          <>
            <svg 
              width="20" 
              height="20" 
              viewBox="0 0 24 24" 
              fill="none" 
              stroke="currentColor" 
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              {/* Triangle outline */}
              <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
              {/* Exclamation mark - line */}
              <line x1="12" y1="9" x2="12" y2="13" />
              {/* Exclamation mark - dot */}
              <line x1="12" y1="17" x2="12.01" y2="17" />
            </svg>
            <span className="text-xs font-medium">Confirm?</span>
          </>
        ) : (
          // Normal state - Trash icon
          <svg 
            width="20" 
            height="20" 
            viewBox="0 0 20 20" 
            fill="none" 
            stroke="currentColor" 
            strokeWidth="2"
          >
            {/* Trash can icon */}
            <path d="M3 5 L17 5" />
            <path d="M8 5 L8 3 L12 3 L12 5" />
            <path d="M5 5 L5 17 C5 17.5 5.5 18 6 18 L14 18 C14.5 18 15 17.5 15 17 L15 5" />
            <path d="M8 8 L8 15" />
            <path d="M12 8 L12 15" />
          </svg>
        )}
      </button>
    </div>
  )
}

