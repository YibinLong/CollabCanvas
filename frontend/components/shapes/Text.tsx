/**
 * Text Shape Component
 * 
 * WHY: We need an editable text component that users can double-click to edit.
 * 
 * WHAT: Renders either:
 * - A foreignObject with HTML textarea (when editing)
 * - SVG text (when not editing, for performance)
 * 
 * HOW: 
 * - Double-click enters edit mode
 * - Click outside or press Escape exits edit mode
 * - The text box has a visible border to show its bounds
 */

'use client'

import { useState, useRef, useEffect } from 'react'
import type { TextShape } from '@/types/canvas'

interface TextProps {
  shape: TextShape
  isSelected?: boolean
  onClick?: (e: React.MouseEvent) => void
  onMouseDown?: (e: React.MouseEvent) => void
  onTextChange?: (newText: string) => void
}

/**
 * Text Component
 * 
 * @param shape - The text shape data (position, text content, fontSize, color)
 * @param isSelected - Whether this shape is currently selected
 * @param onClick - Handler for when user clicks this shape
 * @param onTextChange - Handler for when text content is edited
 */
export default function Text({ shape, isSelected, onClick, onMouseDown, onTextChange }: TextProps) {
  // Track if we're currently editing this text
  const [isEditing, setIsEditing] = useState(false)
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  
  /**
   * Handle double-click to enter edit mode
   * WHY: Double-click is a common pattern for editing text in design tools
   */
  const handleDoubleClick = (e: React.MouseEvent) => {
    e.stopPropagation()
    setIsEditing(true)
  }
  
  /**
   * Auto-focus the textarea when entering edit mode
   * WHY: Users expect to start typing immediately after double-clicking
   */
  useEffect(() => {
    if (isEditing && textareaRef.current) {
      textareaRef.current.focus()
      textareaRef.current.select() // Select all text for easy replacement
    }
  }, [isEditing])
  
  /**
   * Handle text changes
   * WHY: Update the shape's text content as the user types
   */
  const handleTextChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    if (onTextChange) {
      onTextChange(e.target.value)
    }
  }
  
  /**
   * Exit edit mode on blur (click outside) or Escape key
   * WHY: Users need a way to finish editing
   */
  const handleBlur = () => {
    setIsEditing(false)
  }
  
  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Escape') {
      setIsEditing(false)
    }
    // Prevent event from bubbling up (so it doesn't trigger canvas shortcuts)
    e.stopPropagation()
  }
  
  // If editing, show a foreignObject with an HTML textarea
  if (isEditing) {
    return (
      <foreignObject
        x={shape.x}
        y={shape.y}
        width={shape.width}
        height={shape.height}
        data-shape-id={shape.id}
        data-shape-type="text"
      >
        <textarea
          ref={textareaRef}
          value={shape.text}
          onChange={handleTextChange}
          onBlur={handleBlur}
          onKeyDown={handleKeyDown}
          style={{
            width: '100%',
            height: '100%',
            border: '2px solid #0066ff',
            borderRadius: '4px',
            padding: '8px',
            fontSize: `${shape.fontSize || 20}px`,
            color: shape.color || '#000000',
            fontFamily: 'Arial, sans-serif',
            resize: 'none',
            outline: 'none',
            backgroundColor: 'white',
            overflow: 'auto',
            // WHY: These properties ensure text wraps properly within the box
            whiteSpace: 'pre-wrap',  // Preserves line breaks and wraps text
            wordWrap: 'break-word',   // Breaks long words if needed
            overflowWrap: 'break-word', // Modern alternative to word-wrap
          }}
          // Prevent mouse events from bubbling to canvas
          onMouseDown={(e) => e.stopPropagation()}
        />
      </foreignObject>
    )
  }
  
  // When not editing, use foreignObject with a div for proper text wrapping
  // WHY: SVG <text> elements don't support automatic text wrapping
  // Using foreignObject + div gives us proper word wrapping like HTML
  return (
    <g 
      data-shape-id={shape.id}
      data-shape-type="text"
      onDoubleClick={handleDoubleClick}
    >
      {/* Text box border - shows the bounds of the text area */}
      <rect
        x={shape.x}
        y={shape.y}
        width={shape.width}
        height={shape.height}
        fill="white"
        stroke={isSelected ? '#0066ff' : '#cccccc'}
        strokeWidth={isSelected ? 2 : 1}
        strokeDasharray={isSelected ? 'none' : '5,5'}
        onClick={onClick}
        onMouseDown={onMouseDown}
        style={{ cursor: 'pointer' }}
      />
      
      {/* The actual text content - using foreignObject for proper wrapping */}
      <foreignObject
        x={shape.x}
        y={shape.y}
        width={shape.width}
        height={shape.height}
        style={{ pointerEvents: 'none' }} // Let clicks go through to the rect
      >
        <div
          style={{
            width: '100%',
            height: '100%',
            padding: '8px',
            fontSize: `${shape.fontSize || 20}px`,
            color: shape.color || '#000000',
            fontFamily: 'Arial, sans-serif',
            overflow: 'hidden',
            // WHY: These properties ensure text wraps properly within the box
            whiteSpace: 'pre-wrap',      // Preserves line breaks and wraps text
            wordWrap: 'break-word',       // Breaks long words if needed
            overflowWrap: 'break-word',   // Modern alternative to word-wrap
            cursor: 'pointer',
            userSelect: 'none',
          }}
        >
          {shape.text}
        </div>
      </foreignObject>
    </g>
  )
}

