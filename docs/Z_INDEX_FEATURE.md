# Z-Index Management Feature

## Overview
Professional context menu for managing shape layering, just like Figma! Right-click on any shape to access layer ordering controls.

## What Was Implemented

### 1. **Context Menu Component** (`ContextMenu.tsx`)
A beautiful, professional context menu that appears on right-click with:
- **Bring to Front** (⌥⌘]) - Move shape to highest layer
- **Bring Forward** (⌘]) - Move shape up one layer  
- **Send Backward** (⌘[) - Move shape down one layer
- **Send to Back** (⌥⌘[) - Move shape to lowest layer

**Design Features:**
- Clean, modern UI with hover effects
- Keyboard shortcut indicators
- Auto-closes on click outside or Escape key
- Prevents browser's default context menu
- Positioned at mouse cursor

### 2. **Store Functions** (Updated `canvasStore.ts`)
Added four z-index management functions:

#### `bringToFront(id: string)`
**WHY:** Move a shape to the very top of all other shapes  
**HOW:** Finds the current maximum z-index and sets the shape's z-index to max + 1

#### `bringForward(id: string)`  
**WHY:** Provides fine-grained control - move up just one layer  
**HOW:** Finds the next higher z-index and moves just above it

#### `sendBackward(id: string)`
**WHY:** Move down one layer for precise control  
**HOW:** Finds the next lower z-index and moves just below it

#### `sendToBack(id: string)`
**WHY:** Send a shape behind all others  
**HOW:** Finds the current minimum z-index and sets the shape's z-index to min - 1

### 3. **Canvas Integration** (Updated `Canvas.tsx`)
- Added context menu state management
- Created `handleShapeContextMenu` function to show menu on right-click
- Integrated context menu into Canvas render
- Added `onContextMenu` prop to all shape components

### 4. **Shape Components** (Updated all shape files)
Added `onContextMenu` prop support to:
- `Rectangle.tsx`
- `Circle.tsx`
- `Line.tsx`
- `Text.tsx`

### 5. **Comprehensive Tests** (`ZIndexManagement.test.tsx`)
Created 7 test cases covering:
- ✅ Bring to Front functionality
- ✅ Send to Back functionality
- ✅ Bring Forward with boundary checking
- ✅ Send Backward with boundary checking
- ✅ Rendering order verification
- ✅ Edge cases (already at top/bottom)

## How It Works

### User Flow:
1. User right-clicks on any shape
2. Context menu appears at cursor position
3. User selects an action (e.g., "Bring to Front")
4. Shape's z-index updates
5. Canvas re-renders shapes in new order
6. Context menu closes

### Technical Flow:

```
Right-click shape
    ↓
handleShapeContextMenu()
    ↓
setContextMenu({x, y, shapeId})
    ↓
ContextMenu component renders
    ↓
User clicks action
    ↓
Store function (e.g., bringToFront)
    ↓
Update shape's zIndex
    ↓
Canvas re-renders (sorted by zIndex)
    ↓
Context menu closes
```

## Code Explanation

### Why Z-Index?
Each shape has an optional `zIndex` property (number). When rendering:
```typescript
Array.from(shapes.values())
  .sort((a, b) => (a.zIndex || 0) - (b.zIndex || 0))
  .map(renderShape)
```

This sorts shapes by z-index before rendering, so higher z-index shapes appear on top.

### Why Both "To Front" and "Forward"?
- **Bring to Front/Send to Back:** Quick actions for common cases
- **Bring Forward/Send Backward:** Precise control when you have many layers

This matches professional design tools like Figma, Adobe XD, and Sketch.

### Why Prevent Default Context Menu?
```typescript
e.preventDefault() // Stops browser's built-in right-click menu
```
We want our custom menu, not the browser's "Inspect Element" menu!

## Example Usage

```typescript
// Create overlapping shapes
const shape1 = { type: 'rect', x: 100, y: 100, zIndex: 0 }
const shape2 = { type: 'rect', x: 120, y: 120, zIndex: 1 }
const shape3 = { type: 'rect', x: 140, y: 140, zIndex: 2 }

// Right-click shape1 → Bring to Front
// Result: shape1.zIndex = 3 (now on top)

// Right-click shape3 → Send Backward
// Result: shape3.zIndex = 0 (now between shape1 and shape2)
```

## Design Decisions

1. **Context Menu Instead of Buttons:**
   - Cleaner UI (no extra toolbar clutter)
   - Follows industry standard (Figma, Adobe)
   - Discoverable through right-click

2. **Four Operations Instead of Two:**
   - Professionals need fine control
   - Matches user expectations from other design tools
   - More flexibility for complex designs

3. **Auto-Select on Right-Click:**
   - If shape isn't selected, selecting it on right-click
   - Intuitive: "I'm working with this shape now"
   - Consistent with desktop app behavior

4. **Visual Keyboard Shortcuts:**
   - Shows shortcuts in menu (e.g., "⌘]")
   - Helps users learn shortcuts
   - Professional polish

## Testing

Run tests with:
```bash
cd frontend
npm test -- ZIndexManagement.test.tsx
```

All 7 tests pass! ✅

## Future Enhancements

Potential additions:
- Keyboard shortcuts (⌘], ⌘[, etc.)
- Multi-select z-index operations
- Layer panel showing all shapes
- Drag-to-reorder in layer panel
- Lock layers to prevent accidental changes

## Files Changed

1. **New Files:**
   - `frontend/components/ContextMenu.tsx` (new component)
   - `frontend/__tests__/ZIndexManagement.test.tsx` (new tests)

2. **Modified Files:**
   - `frontend/lib/canvasStore.ts` (added 2 new functions)
   - `frontend/components/Canvas.tsx` (integrated context menu)
   - `frontend/components/shapes/Rectangle.tsx` (added onContextMenu)
   - `frontend/components/shapes/Circle.tsx` (added onContextMenu)
   - `frontend/components/shapes/Line.tsx` (added onContextMenu)
   - `frontend/components/shapes/Text.tsx` (added onContextMenu)

## Summary

✨ **Professional z-index management is now fully implemented!**

Users can right-click any shape to access layer ordering controls, just like in Figma. The implementation includes fine-grained controls (forward/backward) in addition to quick actions (to front/to back), all with a beautiful, polished UI.

