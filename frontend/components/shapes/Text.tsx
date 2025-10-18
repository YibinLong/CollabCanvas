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
  onContextMenu?: (e: React.MouseEvent) => void
  onTextChange?: (newText: string) => void
  onEditingChange?: (isEditing: boolean) => void // Notify parent when editing state changes
}

/**
 * Text Component
 * 
 * @param shape - The text shape data (position, text content, fontSize, color)
 * @param isSelected - Whether this shape is currently selected
 * @param onClick - Handler for when user clicks this shape
 * @param onContextMenu - Handler for when user right-clicks this shape
 * @param onTextChange - Handler for when text content is edited
 */
export default function Text({ shape, isSelected, onClick, onMouseDown, onContextMenu, onTextChange, onEditingChange }: TextProps) {
  // Track if we're currently editing this text
  const [isEditing, setIsEditing] = useState(false)
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  const fontSize = shape.fontSize || 20
  const fontWeight = shape.fontWeight || 500
  const fontFamily = shape.fontFamily || 'Inter, Arial, sans-serif'
  const paddingX = shape.paddingX ?? shape.padding ?? 8
  const paddingY = shape.paddingY ?? shape.padding ?? 6
  const textAlign = shape.textAlign || 'left'
  const verticalAlign = shape.verticalAlign || 'top'
  const lineHeight = shape.lineHeight || fontSize * 1.2
  const showBoundingBox = shape.showBoundingBox ?? false
  
  /**
   * Handle double-click to enter edit mode
   * WHY: Double-click is a common pattern for editing text in design tools
   */
  const handleDoubleClick = (e: React.MouseEvent) => {
    e.stopPropagation()
    setIsEditing(true)
    // Notify parent that editing has started
    if (onEditingChange) {
      onEditingChange(true)
    }
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
    // Notify parent that editing has ended
    if (onEditingChange) {
      onEditingChange(false)
    }
  }
  
  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    // Escape key - exit editing without saving
    if (e.key === 'Escape') {
      setIsEditing(false)
      // Notify parent that editing has ended
      if (onEditingChange) {
        onEditingChange(false)
      }
    }
    
    // Enter key - accept changes and exit editing
    // WHY: In design tools like Figma, pressing Enter confirms text changes
    // Shift+Enter is used to create new lines within the text
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault() // Prevent default Enter behavior (which would add a newline)
      setIsEditing(false)
      // Notify parent that editing has ended
      if (onEditingChange) {
        onEditingChange(false)
      }
    }
    
    // Shift+Enter - insert a newline
    // WHY: Allow users to create multi-line text
    // The default textarea behavior handles this automatically when we don't preventDefault
    // So we don't need to do anything special here, just let it through
    
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
            borderRadius: '8px',
            padding: `${paddingY}px ${paddingX}px`,
            fontSize: `${fontSize}px`,
            color: shape.color || '#000000',
            fontFamily,
            fontWeight,
            resize: 'none',
            outline: 'none',
            backgroundColor: 'white',
            overflow: 'auto',
            // WHY: These properties ensure text wraps properly within the box
            whiteSpace: 'pre-wrap',
            wordWrap: 'break-word',
            overflowWrap: 'break-word',
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
  
  // Calculate center point for rotation
  // WHY: Text rotates around its center point, not top-left corner
  const centerX = shape.x + shape.width / 2
  const centerY = shape.y + shape.height / 2
  
  return (
    <g 
      data-shape-id={shape.id}
      data-shape-type="text"
      onDoubleClick={handleDoubleClick}
      // Apply rotation if specified (rotates around center of text box)
      transform={
        shape.rotation
          ? `rotate(${shape.rotation} ${centerX} ${centerY})`
          : undefined
      }
    >
      {/* Text box border - shows the bounds of the text area */}
      {(isSelected || showBoundingBox) && (
        <rect
          x={shape.x}
          y={shape.y}
          width={shape.width}
          height={shape.height}
          fill="transparent"
          stroke={isSelected ? '#2563eb' : '#d1d5db'}
          strokeWidth={isSelected ? 2 : 1}
          onClick={onClick}
          onMouseDown={onMouseDown}
          onContextMenu={onContextMenu}
          style={{ cursor: 'pointer' }}
        />
      )}
      
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
            padding: `${paddingY}px ${paddingX}px`,
            fontSize: `${fontSize}px`,
            color: shape.color || '#000000',
            fontFamily,
            fontWeight,
            lineHeight: `${lineHeight}px`,
            backgroundColor: 'transparent',
            whiteSpace: 'pre-wrap',
            wordWrap: 'break-word',
            overflowWrap: 'break-word',
            textAlign,
            display: 'flex',
            justifyContent: 'flex-start',
            alignItems: verticalAlign === 'center' ? 'center' : verticalAlign === 'bottom' ? 'flex-end' : 'flex-start',
            cursor: 'pointer',
            userSelect: 'none',
          }}
        >
          <span style={{ width: '100%' }}>{shape.text}</span>
        </div>
      </foreignObject>
    </g>
  )
}

