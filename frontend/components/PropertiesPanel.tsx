/**
 * PropertiesPanel Component - Figma-style Properties Editor
 * 
 * WHY: Users need to edit shape properties like color, position, size.
 * This panel appears when shapes are selected, similar to Figma's right sidebar.
 * 
 * WHAT: A floating panel that shows:
 * - Color picker for changing shape fill/stroke color
 * - (Future: position, size, rotation controls)
 * 
 * HOW:
 * - Renders only when shapes are selected
 * - Updates all selected shapes when color changes
 * - Uses native HTML5 color input for simplicity
 */

'use client'

import { useCanvasStore } from '@/lib/canvasStore'

/**
 * PropertiesPanel component
 * 
 * WHY: This is where users edit properties of selected shapes (Figma-like).
 * It shows a color picker and other controls based on what's selected.
 */
export default function PropertiesPanel() {
  const { shapes, selectedIds, updateShape, updateMultipleShapes } = useCanvasStore()
  
  // Hide panel if nothing is selected
  // WHY: Panel should only show when relevant
  if (selectedIds.length === 0) {
    return null
  }
  
  // Get the first selected shape to show its color
  // WHY: If multiple shapes selected, show color of the first one as a reference
  const firstSelectedShape = shapes.get(selectedIds[0])
  const currentColor = firstSelectedShape?.color || '#3b82f6'
  
  /**
   * Handle color change
   * 
   * WHY: When user changes color, update all selected shapes.
   * This is how Figma works - bulk property updates.
   * 
   * HOW: Loop through all selected shape IDs and update their color.
   */
  const handleColorChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newColor = e.target.value
    
    if (selectedIds.length === 1) {
      // Single shape: use updateShape for simplicity
      updateShape(selectedIds[0], { color: newColor })
    } else {
      // Multiple shapes: batch update for performance
      const updates = selectedIds.map(id => ({
        id,
        updates: { color: newColor }
      }))
      updateMultipleShapes(updates)
    }
  }
  
  return (
    <div className="absolute top-4 right-4 bg-white rounded-lg shadow-lg p-4 min-w-[240px]">
      {/* Panel Header */}
      <h3 className="text-sm font-semibold text-gray-700 mb-3">
        {selectedIds.length === 1 ? 'Properties' : `${selectedIds.length} shapes selected`}
      </h3>
      
      {/* Color Section */}
      <div className="mb-4">
        <label htmlFor="color-picker" className="block text-xs font-medium text-gray-600 mb-2">
          Fill Color
        </label>
        <div className="flex items-center gap-2">
          {/* Color Input - Native HTML5 color picker */}
          {/* WHY: Simple, works everywhere, no extra dependencies */}
          <input
            id="color-picker"
            data-testid="color-picker"
            type="color"
            value={currentColor}
            onChange={handleColorChange}
            className="w-12 h-12 rounded border border-gray-300 cursor-pointer"
            title="Choose color"
          />
          
          {/* Hex Value Display */}
          <div className="flex-1">
            <input
              type="text"
              value={currentColor}
              onChange={(e) => {
                // Allow typing hex values directly
                const value = e.target.value
                if (/^#[0-9A-Fa-f]{6}$/.test(value)) {
                  if (selectedIds.length === 1) {
                    updateShape(selectedIds[0], { color: value })
                  } else {
                    const updates = selectedIds.map(id => ({
                      id,
                      updates: { color: value }
                    }))
                    updateMultipleShapes(updates)
                  }
                }
              }}
              className="w-full px-2 py-1 text-sm border border-gray-300 rounded"
              placeholder="#000000"
            />
          </div>
        </div>
      </div>
      
      {/* Info Text */}
      <div className="text-xs text-gray-500">
        {selectedIds.length > 1 && 'Changing color applies to all selected shapes'}
      </div>
    </div>
  )
}

