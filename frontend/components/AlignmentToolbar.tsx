/**
 * AlignmentToolbar Component - Figma-style Alignment Controls
 * 
 * WHY: Alignment is essential for precise layouts in design tools (Figma-like).
 * Users need quick access to alignment and distribution functions.
 * 
 * WHAT: A floating toolbar that shows:
 * - "Alignment" label so users know what this toolbar does
 * - Align Left, Right, Top, Bottom buttons
 * - Distribute Horizontally, Vertically buttons (when 3+ shapes selected)
 * - Hover tooltips showing the name of each tool (like Figma)
 * - Only visible when 2+ shapes are selected
 * 
 * HOW:
 * - Renders only when multiple shapes are selected
 * - Calls alignment functions from canvasStore
 * - Uses custom tooltips (like UserAvatars) with group-hover pattern
 * - Styled like Figma's alignment toolbar
 */

'use client'

import { useCanvasStore } from '@/lib/canvasStore'

/**
 * AlignmentButton - Reusable button with tooltip
 * 
 * WHY: Each alignment button needs consistent styling and tooltip behavior.
 * This component ensures all buttons look and work the same way.
 * 
 * @param onClick - Function to call when clicked
 * @param testId - Test ID for testing
 * @param label - Text to show in tooltip
 * @param children - SVG icon to display
 */
interface AlignmentButtonProps {
  onClick: () => void
  testId: string
  label: string
  children: React.ReactNode
}

function AlignmentButton({ onClick, testId, label, children }: AlignmentButtonProps) {
  return (
    <div className="relative group">
      <button
        data-testid={testId}
        onClick={onClick}
        className="p-2 hover:bg-gray-100 rounded transition-colors"
      >
        {children}
      </button>
      
      {/* Custom tooltip (appears on hover) */}
      <div
        className="
          absolute top-full mt-2 left-1/2 transform -translate-x-1/2
          bg-gray-900 text-white text-xs px-2 py-1 rounded
          whitespace-nowrap
          opacity-0 group-hover:opacity-100
          pointer-events-none
          transition-opacity duration-200
          z-50
        "
      >
        {label}
        {/* Tooltip arrow pointing up */}
        <div
          className="
            absolute bottom-full left-1/2 transform -translate-x-1/2
            w-0 h-0
            border-l-4 border-l-transparent
            border-r-4 border-r-transparent
            border-b-4 border-b-gray-900
          "
        />
      </div>
    </div>
  )
}

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
    <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 bg-white rounded-lg shadow-lg p-3 flex items-center gap-3">
      {/* Toolbar Label - tells users what this toolbar does */}
      <span className="text-sm font-medium text-gray-700 pr-2 border-r border-gray-300">
        Alignment
      </span>
      
      {/* Alignment Section */}
      <div className="flex gap-1 pr-2 border-r border-gray-300">
        {/* Align Left */}
        <AlignmentButton
          onClick={alignLeft}
          testId="align-left"
          label="Align Left"
        >
          <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
            <rect x="3" y="3" width="2" height="14" fill="currentColor"/>
            <rect x="7" y="5" width="8" height="3" fill="currentColor"/>
            <rect x="7" y="12" width="6" height="3" fill="currentColor"/>
          </svg>
        </AlignmentButton>
        
        {/* Align Right */}
        <AlignmentButton
          onClick={alignRight}
          testId="align-right"
          label="Align Right"
        >
          <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
            <rect x="15" y="3" width="2" height="14" fill="currentColor"/>
            <rect x="5" y="5" width="8" height="3" fill="currentColor"/>
            <rect x="7" y="12" width="6" height="3" fill="currentColor"/>
          </svg>
        </AlignmentButton>
        
        {/* Align Top */}
        <AlignmentButton
          onClick={alignTop}
          testId="align-top"
          label="Align Top"
        >
          <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
            <rect x="3" y="3" width="14" height="2" fill="currentColor"/>
            <rect x="5" y="7" width="3" height="8" fill="currentColor"/>
            <rect x="12" y="7" width="3" height="6" fill="currentColor"/>
          </svg>
        </AlignmentButton>
        
        {/* Align Bottom */}
        <AlignmentButton
          onClick={alignBottom}
          testId="align-bottom"
          label="Align Bottom"
        >
          <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
            <rect x="3" y="15" width="14" height="2" fill="currentColor"/>
            <rect x="5" y="5" width="3" height="8" fill="currentColor"/>
            <rect x="12" y="7" width="3" height="6" fill="currentColor"/>
          </svg>
        </AlignmentButton>
      </div>
      
      {/* Distribution Section - only show if 3+ shapes */}
      {selectedIds.length >= 3 && (
        <div className="flex gap-1">
          {/* Distribute Horizontally */}
          <AlignmentButton
            onClick={distributeHorizontally}
            testId="distribute-horizontal"
            label="Distribute Horizontally"
          >
            <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
              <rect x="3" y="8" width="3" height="4" fill="currentColor"/>
              <rect x="8.5" y="8" width="3" height="4" fill="currentColor"/>
              <rect x="14" y="8" width="3" height="4" fill="currentColor"/>
              <path d="M 6 10 L 8.5 10" stroke="currentColor" strokeDasharray="1,1"/>
              <path d="M 11.5 10 L 14 10" stroke="currentColor" strokeDasharray="1,1"/>
            </svg>
          </AlignmentButton>
          
          {/* Distribute Vertically */}
          <AlignmentButton
            onClick={distributeVertically}
            testId="distribute-vertical"
            label="Distribute Vertically"
          >
            <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
              <rect x="8" y="3" width="4" height="3" fill="currentColor"/>
              <rect x="8" y="8.5" width="4" height="3" fill="currentColor"/>
              <rect x="8" y="14" width="4" height="3" fill="currentColor"/>
              <path d="M 10 6 L 10 8.5" stroke="currentColor" strokeDasharray="1,1"/>
              <path d="M 10 11.5 L 10 14" stroke="currentColor" strokeDasharray="1,1"/>
            </svg>
          </AlignmentButton>
        </div>
      )}
      
      {/* Selection count label */}
      <span className="text-xs text-gray-500 pl-2 border-l border-gray-300 hidden sm:inline">
        {selectedIds.length} selected
      </span>
    </div>
  )
}

