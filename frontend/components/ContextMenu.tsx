/**
 * ContextMenu Component - Right-Click Menu for Shape Actions
 * 
 * WHY: Users need a convenient way to access shape layering controls.
 * 
 * WHAT: Shows "Bring to Front" and "Send to Back" options.
 * 
 * HOW: Appears at cursor position on right-click, closes on outside click or action.
 */

'use client'

import { useEffect, useRef } from 'react'
import { useCanvasStore } from '@/lib/canvasStore'

/**
 * Props for ContextMenu
 */
interface ContextMenuProps {
  x: number                    // Mouse X position (screen coordinates)
  y: number                    // Mouse Y position (screen coordinates)
  shapeId: string              // ID of the shape that was right-clicked
  onClose: () => void          // Callback to close the menu
}

/**
 * ContextMenu Component
 * 
 * WHY: Provides a professional-looking menu for shape operations.
 * This follows Figma's design pattern where right-clicking opens a context menu.
 */
export default function ContextMenu({ x, y, shapeId, onClose }: ContextMenuProps) {
  const { bringToFront, sendToBack } = useCanvasStore()
  const menuRef = useRef<HTMLDivElement>(null)
  
  /**
   * Close menu when clicking outside
   * 
   * WHY: Context menus should close when user clicks elsewhere.
   * This is standard behavior in all UI frameworks.
   */
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        onClose()
      }
    }
    
    // Also close on Escape key
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose()
      }
    }
    
    // Add listeners after a small delay to prevent immediate closing
    // WHY: The right-click event that opened the menu would also trigger
    // the click-outside handler immediately. Delay prevents this.
    setTimeout(() => {
      document.addEventListener('mousedown', handleClickOutside)
      document.addEventListener('keydown', handleEscape)
    }, 0)
    
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
      document.removeEventListener('keydown', handleEscape)
    }
  }, [onClose])
  
  /**
   * Handle menu option click
   * 
   * WHY: When user selects an option, perform the action and close the menu.
   * 
   * @param action - The action to perform
   */
  const handleAction = (action: () => void) => {
    action()
    onClose()
  }
  
  return (
    <div
      ref={menuRef}
      className="fixed bg-white rounded-lg shadow-2xl border border-gray-200 py-1 z-[9999]"
      style={{
        left: `${x}px`,
        top: `${y}px`,
        minWidth: '180px',
      }}
    >
      {/* Menu options */}
      <button
        onClick={() => handleAction(() => bringToFront(shapeId))}
        className="w-full text-left px-3 py-2 text-sm hover:bg-blue-50 hover:text-blue-600 transition-colors flex items-center justify-between"
      >
        <span>Bring to Front</span>
        <span className="ml-4 text-xs text-gray-400">⇧]</span>
      </button>
      
      <button
        onClick={() => handleAction(() => sendToBack(shapeId))}
        className="w-full text-left px-3 py-2 text-sm hover:bg-blue-50 hover:text-blue-600 transition-colors flex items-center justify-between"
      >
        <span>Send to Back</span>
        <span className="ml-4 text-xs text-gray-400">⇧[</span>
      </button>
    </div>
  )
}

