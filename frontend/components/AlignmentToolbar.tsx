/**
 * AlignmentToolbar Component - Figma-style Alignment Controls
 * 
 * WHY: Alignment is essential for precise layouts in design tools (Figma-like).
 * Users need quick access to alignment and distribution functions.
 * 
 * WHAT: A floating toolbar that shows:
 * - Align Left, Right, Top, Bottom buttons
 * - Distribute Horizontally, Vertically buttons
 * - Only visible when 2+ shapes are selected
 * 
 * HOW:
 * - Renders only when multiple shapes are selected
 * - Calls alignment functions from canvasStore
 * - Styled like Figma's alignment toolbar
 */

'use client'

import { useCanvasStore } from '@/lib/canvasStore'

/**
 * AlignmentToolbar component
 * 
 * WHY: Provides UI for alignment operations (Figma-like).
 * Shows when 2+ shapes selected (alignment only works with multiple shapes).
 */
export default function AlignmentToolbar() {
  const { 
    selectedIds, 
    alignLeft, 
    alignRight, 
    alignTop, 
    alignBottom,
    distributeHorizontally,
    distributeVertically
  } = useCanvasStore()
  
  // Hide toolbar if less than 2 shapes selected
  // WHY: Alignment only makes sense with multiple shapes
  if (selectedIds.length < 2) {
    return null
  }
  
  return (
    <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 bg-white rounded-lg shadow-lg p-2 flex items-center gap-1">
      {/* Alignment Section */}
      <div className="flex gap-1 pr-2 border-r border-gray-300">
        {/* Align Left */}
        <button
          data-testid="align-left"
          onClick={alignLeft}
          className="p-2 hover:bg-gray-100 rounded transition-colors"
          title="Align Left"
        >
          <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
            <rect x="3" y="3" width="2" height="14" fill="currentColor"/>
            <rect x="7" y="5" width="8" height="3" fill="currentColor"/>
            <rect x="7" y="12" width="6" height="3" fill="currentColor"/>
          </svg>
        </button>
        
        {/* Align Right */}
        <button
          data-testid="align-right"
          onClick={alignRight}
          className="p-2 hover:bg-gray-100 rounded transition-colors"
          title="Align Right"
        >
          <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
            <rect x="15" y="3" width="2" height="14" fill="currentColor"/>
            <rect x="5" y="5" width="8" height="3" fill="currentColor"/>
            <rect x="7" y="12" width="6" height="3" fill="currentColor"/>
          </svg>
        </button>
        
        {/* Align Top */}
        <button
          data-testid="align-top"
          onClick={alignTop}
          className="p-2 hover:bg-gray-100 rounded transition-colors"
          title="Align Top"
        >
          <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
            <rect x="3" y="3" width="14" height="2" fill="currentColor"/>
            <rect x="5" y="7" width="3" height="8" fill="currentColor"/>
            <rect x="12" y="7" width="3" height="6" fill="currentColor"/>
          </svg>
        </button>
        
        {/* Align Bottom */}
        <button
          data-testid="align-bottom"
          onClick={alignBottom}
          className="p-2 hover:bg-gray-100 rounded transition-colors"
          title="Align Bottom"
        >
          <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
            <rect x="3" y="15" width="14" height="2" fill="currentColor"/>
            <rect x="5" y="5" width="3" height="8" fill="currentColor"/>
            <rect x="12" y="7" width="3" height="6" fill="currentColor"/>
          </svg>
        </button>
      </div>
      
      {/* Distribution Section - only show if 3+ shapes */}
      {selectedIds.length >= 3 && (
        <div className="flex gap-1 pl-2">
          {/* Distribute Horizontally */}
          <button
            data-testid="distribute-horizontal"
            onClick={distributeHorizontally}
            className="p-2 hover:bg-gray-100 rounded transition-colors"
            title="Distribute Horizontally"
          >
            <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
              <rect x="3" y="8" width="3" height="4" fill="currentColor"/>
              <rect x="8.5" y="8" width="3" height="4" fill="currentColor"/>
              <rect x="14" y="8" width="3" height="4" fill="currentColor"/>
              <path d="M 6 10 L 8.5 10" stroke="currentColor" strokeDasharray="1,1"/>
              <path d="M 11.5 10 L 14 10" stroke="currentColor" strokeDasharray="1,1"/>
            </svg>
          </button>
          
          {/* Distribute Vertically */}
          <button
            data-testid="distribute-vertical"
            onClick={distributeVertically}
            className="p-2 hover:bg-gray-100 rounded transition-colors"
            title="Distribute Vertically"
          >
            <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
              <rect x="8" y="3" width="4" height="3" fill="currentColor"/>
              <rect x="8" y="8.5" width="4" height="3" fill="currentColor"/>
              <rect x="8" y="14" width="4" height="3" fill="currentColor"/>
              <path d="M 10 6 L 10 8.5" stroke="currentColor" strokeDasharray="1,1"/>
              <path d="M 10 11.5 L 10 14" stroke="currentColor" strokeDasharray="1,1"/>
            </svg>
          </button>
        </div>
      )}
      
      {/* Label */}
      <span className="text-xs text-gray-500 ml-2 hidden sm:inline">
        {selectedIds.length} selected
      </span>
    </div>
  )
}

