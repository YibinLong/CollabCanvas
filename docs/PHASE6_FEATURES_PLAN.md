# Phase 6: Advanced Canvas Features - Implementation Plan

> **Strategic Addition**: 5 high-value, low-risk features to boost rubric score by +9 points

---

## 📊 Scoring Impact

| Feature | Tier | Time | Points | Cumulative | Risk |
|---------|------|------|--------|------------|------|
| Arrow Keys | 1 | 15m | 2 | 2 | 🟢 Zero |
| Duplicate | 1 | 20m | 2 | 4 | 🟢 Zero |
| Copy/Paste | 1 | 25m | 2 | 6 | 🟢 Zero |
| Color Picker | 1 | 45m | 0* | 6 | 🟢 Zero |
| Alignment Tools | 2 | 60m | 3 | **9** | 🟢 Zero |

**Total: +9 points in ~2.5 hours**

*Color picker is 4th Tier 1 feature (max 3 count), but still good for UX

---

## 🎯 Implementation Order

### PR #24: Arrow Keys (15 minutes)
**Location:** `frontend/components/Canvas.tsx` in `handleKeyDown`

```typescript
// Add to existing handleKeyDown function
if (!isTyping && selectedIds.length > 0) {
  const moveAmount = e.shiftKey ? 10 : 1;
  
  if (e.key === 'ArrowUp') {
    e.preventDefault();
    selectedIds.forEach(id => {
      const shape = shapes.get(id);
      if (shape) updateShape(id, { y: shape.y - moveAmount });
    });
  }
  if (e.key === 'ArrowDown') {
    e.preventDefault();
    selectedIds.forEach(id => {
      const shape = shapes.get(id);
      if (shape) updateShape(id, { y: shape.y + moveAmount });
    });
  }
  if (e.key === 'ArrowLeft') {
    e.preventDefault();
    selectedIds.forEach(id => {
      const shape = shapes.get(id);
      if (shape) updateShape(id, { x: shape.x - moveAmount });
    });
  }
  if (e.key === 'ArrowRight') {
    e.preventDefault();
    selectedIds.forEach(id => {
      const shape = shapes.get(id);
      if (shape) updateShape(id, { x: shape.x + moveAmount });
    });
  }
}
```

---

### PR #25: Duplicate (20 minutes)
**Location:** `frontend/components/Canvas.tsx` in `handleKeyDown`

```typescript
// Add Cmd+D / Ctrl+D handler
if ((e.metaKey || e.ctrlKey) && e.key === 'd' && !isTyping) {
  e.preventDefault();
  
  const newIds: string[] = [];
  selectedIds.forEach(id => {
    const shape = shapes.get(id);
    if (shape) {
      const duplicate = {
        ...shape,
        id: generateId(),
        x: shape.x + 20,
        y: shape.y + 20,
      };
      addShape(duplicate);
      newIds.push(duplicate.id);
    }
  });
  
  // Select the duplicated shapes
  selectMultiple(newIds);
}
```

---

### PR #26: Copy/Paste (25 minutes)
**Location:** `frontend/components/Canvas.tsx`

```typescript
// Add to Canvas component (top level)
const clipboardRef = useRef<Shape[]>([]);

// In handleKeyDown, add:

// Copy (Cmd+C)
if ((e.metaKey || e.ctrlKey) && e.key === 'c' && !isTyping && selectedIds.length > 0) {
  e.preventDefault();
  clipboardRef.current = selectedIds
    .map(id => shapes.get(id))
    .filter(Boolean) as Shape[];
  console.log(`Copied ${clipboardRef.current.length} shape(s)`);
}

// Paste (Cmd+V)
if ((e.metaKey || e.ctrlKey) && e.key === 'v' && !isTyping && clipboardRef.current.length > 0) {
  e.preventDefault();
  
  const newIds: string[] = [];
  clipboardRef.current.forEach(shape => {
    const pasted = {
      ...shape,
      id: generateId(),
      x: shape.x + 30,
      y: shape.y + 30,
    };
    addShape(pasted);
    newIds.push(pasted.id);
  });
  
  // Select the pasted shapes
  selectMultiple(newIds);
}
```

---

### PR #27: Color Picker (45 minutes)
**New File:** `frontend/components/PropertiesPanel.tsx`

```typescript
'use client'

import { useCanvasStore } from '@/lib/canvasStore'

export default function PropertiesPanel() {
  const { shapes, selectedIds, updateShape } = useCanvasStore();
  
  if (selectedIds.length === 0) return null;
  
  const selectedShape = shapes.get(selectedIds[0]);
  if (!selectedShape) return null;
  
  // Only show color picker for shapes that have color
  const hasColor = 'color' in selectedShape;
  if (!hasColor) return null;
  
  return (
    <div className="absolute top-20 right-4 bg-white p-4 rounded-lg shadow-lg border border-gray-200">
      <h3 className="text-sm font-semibold mb-2 text-gray-700">Properties</h3>
      
      <div className="space-y-3">
        <div>
          <label className="block text-xs text-gray-600 mb-1">
            Color {selectedIds.length > 1 && `(${selectedIds.length} selected)`}
          </label>
          <input
            type="color"
            value={selectedShape.color}
            onChange={(e) => {
              // Update all selected shapes
              selectedIds.forEach(id => {
                const shape = shapes.get(id);
                if (shape && 'color' in shape) {
                  updateShape(id, { color: e.target.value });
                }
              });
            }}
            className="w-full h-10 rounded cursor-pointer"
          />
        </div>
        
        {/* Can add more properties here later */}
      </div>
    </div>
  );
}
```

**Add to Canvas.tsx:**
```typescript
import PropertiesPanel from './PropertiesPanel'

// In return statement, add before closing </div>:
<PropertiesPanel />
```

---

### PR #28: Alignment Tools (60 minutes)

**Step 1:** Add functions to `frontend/lib/canvasStore.ts`:

```typescript
// Add to CanvasStore interface:
alignShapesLeft: () => void
alignShapesRight: () => void
alignShapesTop: () => void
alignShapesBottom: () => void
alignShapesCenterHorizontal: () => void
alignShapesCenterVertical: () => void
distributeHorizontally: () => void
distributeVertically: () => void

// Add implementations to store:
alignShapesLeft: () => {
  set((state) => {
    if (state.selectedIds.length < 2) return state;
    
    const selectedShapes = state.selectedIds
      .map(id => state.shapes.get(id))
      .filter(Boolean) as Shape[];
    
    const minX = Math.min(...selectedShapes.map(s => s.x));
    
    const newShapes = new Map(state.shapes);
    state.selectedIds.forEach(id => {
      const shape = state.shapes.get(id);
      if (shape) {
        newShapes.set(id, { ...shape, x: minX });
      }
    });
    
    return { shapes: newShapes };
  });
},

alignShapesRight: () => {
  set((state) => {
    if (state.selectedIds.length < 2) return state;
    
    const selectedShapes = state.selectedIds
      .map(id => state.shapes.get(id))
      .filter(Boolean) as Shape[];
    
    // Calculate rightmost x based on shape type
    const maxRightX = Math.max(...selectedShapes.map(s => {
      if (s.type === 'rect') return s.x + s.width;
      if (s.type === 'circle') return s.x + s.radius;
      if (s.type === 'text') return s.x + s.width;
      return s.x;
    }));
    
    const newShapes = new Map(state.shapes);
    state.selectedIds.forEach(id => {
      const shape = state.shapes.get(id);
      if (shape) {
        let newX = maxRightX;
        if (shape.type === 'rect') newX = maxRightX - shape.width;
        else if (shape.type === 'circle') newX = maxRightX - shape.radius;
        else if (shape.type === 'text') newX = maxRightX - shape.width;
        
        newShapes.set(id, { ...shape, x: newX });
      }
    });
    
    return { shapes: newShapes };
  });
},

alignShapesTop: () => {
  set((state) => {
    if (state.selectedIds.length < 2) return state;
    
    const selectedShapes = state.selectedIds
      .map(id => state.shapes.get(id))
      .filter(Boolean) as Shape[];
    
    const minY = Math.min(...selectedShapes.map(s => s.y));
    
    const newShapes = new Map(state.shapes);
    state.selectedIds.forEach(id => {
      const shape = state.shapes.get(id);
      if (shape) {
        newShapes.set(id, { ...shape, y: minY });
      }
    });
    
    return { shapes: newShapes };
  });
},

alignShapesBottom: () => {
  set((state) => {
    if (state.selectedIds.length < 2) return state;
    
    const selectedShapes = state.selectedIds
      .map(id => state.shapes.get(id))
      .filter(Boolean) as Shape[];
    
    const maxBottomY = Math.max(...selectedShapes.map(s => {
      if (s.type === 'rect') return s.y + s.height;
      if (s.type === 'circle') return s.y + s.radius;
      if (s.type === 'text') return s.y + s.height;
      return s.y;
    }));
    
    const newShapes = new Map(state.shapes);
    state.selectedIds.forEach(id => {
      const shape = state.shapes.get(id);
      if (shape) {
        let newY = maxBottomY;
        if (shape.type === 'rect') newY = maxBottomY - shape.height;
        else if (shape.type === 'circle') newY = maxBottomY - shape.radius;
        else if (shape.type === 'text') newY = maxBottomY - shape.height;
        
        newShapes.set(id, { ...shape, y: newY });
      }
    });
    
    return { shapes: newShapes };
  });
},

alignShapesCenterHorizontal: () => {
  set((state) => {
    if (state.selectedIds.length < 2) return state;
    
    const selectedShapes = state.selectedIds
      .map(id => state.shapes.get(id))
      .filter(Boolean) as Shape[];
    
    // Find center x of all shapes
    const centers = selectedShapes.map(s => {
      if (s.type === 'rect') return s.x + s.width / 2;
      if (s.type === 'circle') return s.x;
      if (s.type === 'text') return s.x + s.width / 2;
      return s.x;
    });
    const avgCenterX = centers.reduce((a, b) => a + b, 0) / centers.length;
    
    const newShapes = new Map(state.shapes);
    state.selectedIds.forEach(id => {
      const shape = state.shapes.get(id);
      if (shape) {
        let newX = avgCenterX;
        if (shape.type === 'rect') newX = avgCenterX - shape.width / 2;
        else if (shape.type === 'text') newX = avgCenterX - shape.width / 2;
        // Circle x is already center
        
        newShapes.set(id, { ...shape, x: newX });
      }
    });
    
    return { shapes: newShapes };
  });
},

// Similar for alignShapesCenterVertical, distributeHorizontally, distributeVertically
```

**Step 2:** Create `frontend/components/AlignmentToolbar.tsx`:

```typescript
'use client'

import { useCanvasStore } from '@/lib/canvasStore'

export default function AlignmentToolbar() {
  const { selectedIds, alignShapesLeft, alignShapesRight, alignShapesTop, alignShapesBottom } = useCanvasStore();
  
  // Only show if 2+ shapes selected
  if (selectedIds.length < 2) return null;
  
  return (
    <div className="absolute top-20 left-1/2 transform -translate-x-1/2 bg-white shadow-lg rounded-lg p-2 flex gap-1">
      <button
        onClick={alignShapesLeft}
        className="p-2 hover:bg-gray-100 rounded"
        title="Align Left"
      >
        ⬅️
      </button>
      <button
        onClick={alignShapesRight}
        className="p-2 hover:bg-gray-100 rounded"
        title="Align Right"
      >
        ➡️
      </button>
      <button
        onClick={alignShapesTop}
        className="p-2 hover:bg-gray-100 rounded"
        title="Align Top"
      >
        ⬆️
      </button>
      <button
        onClick={alignShapesBottom}
        className="p-2 hover:bg-gray-100 rounded"
        title="Align Bottom"
      >
        ⬇️
      </button>
    </div>
  );
}
```

---

## ✅ Why This Order?

1. **Arrow Keys** → Proves keyboard handling works, easiest win
2. **Duplicate** → Builds pattern for cloning shapes
3. **Copy/Paste** → Extends duplicate, uses clipboard ref
4. **Color Picker** → Independent UI, doesn't affect other features
5. **Alignment** → Most complex, requires store changes, do last

## 🚀 Next Steps

After completing Phase 6, you'll have:
- **+9 points** added to your score (~55 → ~64)
- Better UX for shape manipulation
- Foundation for more advanced features
- No regression risk to existing functionality

Then proceed to **Phase 7: AI Integration** for the big +25 point boost!

---

**Updated:** October 15, 2025  
**Status:** Planned (PRs #24-28)  
**Priority:** HIGH - Do before AI Agent

