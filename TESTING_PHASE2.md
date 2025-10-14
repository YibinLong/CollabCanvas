# 🎨 Phase 2 Canvas - Local Testing Guide

This guide will help you run the app locally and test all the canvas features we built!

---

## 🚀 Step 1: Start the Frontend

Open a terminal and run these commands:

```bash
cd /Users/yibin/Documents/WORKZONE/VSCODE/GAUNTLET_AI/1_Week/Figma_Clone/frontend

# Install dependencies (if not already installed)
npm install

# Start the development server
npm run dev
```

**What you'll see:**
```
> collabcanvas-frontend@0.1.0 dev
> next dev

   ▲ Next.js 14.0.0
   - Local:        http://localhost:3000
   - Environments: .env

 ✓ Ready in 2.5s
```

**Open your browser:** Go to `http://localhost:3000`

You should see:
- A dark gray canvas with a grid background
- A toolbar at the top with shape tools
- Keyboard shortcuts in the bottom-left corner

---

## ✅ Step 2: Test Each Feature

### 🖱️ Feature 1: Pan & Zoom

**WHY:** Navigate around the infinite canvas to see different areas of your design.

**Test Pan:**
1. ✅ **Click and drag** on the empty canvas → Canvas should move with your mouse
2. ✅ Hold **Space** key and drag → Canvas should pan (cursor changes to grab hand)
3. ✅ Check the viewport indicator → Should show movement

**Test Zoom:**
1. ✅ **Scroll mouse wheel up** → Should zoom in (zoom % increases)
2. ✅ **Scroll mouse wheel down** → Should zoom out (zoom % decreases)
3. ✅ Move mouse to different positions and scroll → Zoom should center on cursor
4. ✅ Check bottom-right corner → Shows zoom percentage (e.g., "100%", "150%")

**Expected Result:**
- Smooth panning with no lag
- Zoom centers on mouse cursor position
- Zoom indicator updates in real-time
- Grid moves with pan/zoom

---

### ✏️ Feature 2: Create Shapes

**WHY:** Add rectangles, circles, lines, and text to your canvas.

**Test Rectangle:**
1. ✅ Click the **Rectangle** button in the toolbar (becomes blue)
2. ✅ **Click once** on the canvas → Creates a 100x100 blue rectangle
3. ✅ **Click and drag** on canvas → Creates a rectangle with custom size
4. ✅ Check tool indicator (top-left) → Should say "rect Tool"

**Test Circle:**
1. ✅ Click the **Circle** button in the toolbar
2. ✅ **Click once** on canvas → Creates a green circle (radius 50)
3. ✅ **Click and drag** → Creates a circle (size based on drag distance)

**Test Line:**
1. ✅ Click the **Line** button in the toolbar
2. ✅ **Click once** → Creates a red line
3. ✅ **Click and drag** → Creates a line from start to end point

**Test Text:**
1. ✅ Click the **Text** button in the toolbar
2. ✅ **Click** on canvas → Creates a text element that says "Text"

**Expected Result:**
- Each shape appears immediately when created
- Shapes have default colors (Rectangle=blue, Circle=green, Line=red, Text=black)
- Newly created shape is automatically selected (blue outline)
- Can create multiple shapes of the same type

---

### 🎯 Feature 3: Select Shapes

**WHY:** You need to select shapes before you can move, resize, or delete them.

**Test Single Selection:**
1. ✅ Click the **Select** button (cursor icon) in toolbar
2. ✅ **Click any shape** → Shape gets blue outline (selected)
3. ✅ **Click another shape** → Previous shape deselects, new one selects
4. ✅ **Click empty canvas** → All shapes deselect

**Test Multi-Selection:**
1. ✅ Click a shape to select it
2. ✅ Hold **Shift** and click another shape → Both are now selected (both have blue outline)
3. ✅ Hold **Shift** and click a third shape → All three are selected
4. ✅ Hold **Shift** and click a selected shape → That shape deselects

**Expected Result:**
- Selected shapes show blue stroke outline
- Unselected shapes have no stroke
- Multiple shapes can be selected simultaneously
- Shift+click toggles individual shapes

---

### 🔄 Feature 4: Move Shapes

**WHY:** Reposition shapes to arrange your design.

**Test Move:**
1. ✅ Make sure **Select** tool is active
2. ✅ Click a shape to select it
3. ✅ **Click and drag** the shape → Shape moves with your cursor
4. ✅ Release mouse → Shape stays in new position
5. ✅ Try moving multiple selected shapes → All selected shapes move together

**Expected Result:**
- Shape follows cursor smoothly during drag
- Can drag shapes anywhere on the canvas
- Multiple selected shapes maintain their relative positions
- Unselected shapes cannot be moved (clicking them selects them first)

---

### 📏 Feature 5: Resize Shapes

**WHY:** Change the size of shapes to fit your design.

**Test Resize Handles:**
1. ✅ Select a rectangle or circle
2. ✅ Look for **8 white circles** with blue outline around the shape
   - 4 at corners (resize both width and height)
   - 4 at edges (resize one dimension)

**Test Corner Resize:**
1. ✅ **Hover** over a corner handle → Cursor changes to diagonal arrow
2. ✅ **Click and drag** corner handle → Shape resizes diagonally
3. ✅ Try all 4 corners → Each resizes from its opposite corner

**Test Edge Resize:**
1. ✅ **Hover** over right edge handle → Cursor changes to horizontal arrow
2. ✅ **Drag right handle** → Width changes, height stays the same
3. ✅ Try top handle → Height changes, width stays the same
4. ✅ Try all 4 edge handles

**Expected Result:**
- 8 handles visible on selected shape
- Corner handles resize both dimensions
- Edge handles resize one dimension only
- Shape maintains minimum size (10px) when resizing
- Cursor changes to show resize direction

---

### 🗑️ Feature 6: Delete Shapes

**WHY:** Remove shapes you don't want.

**Test Single Delete:**
1. ✅ Select a shape
2. ✅ Press **Delete** key → Shape disappears
3. ✅ Create another shape, select it
4. ✅ Press **Backspace** key → Shape disappears (Mac users)

**Test Multi Delete:**
1. ✅ Create 3-4 shapes
2. ✅ Shift+click to select 2 of them
3. ✅ Press **Delete** → Both selected shapes disappear
4. ✅ Unselected shapes remain

**Test No Selection:**
1. ✅ Click empty canvas (deselect all)
2. ✅ Press **Delete** → Nothing happens (no error)

**Expected Result:**
- Delete/Backspace removes selected shapes immediately
- Multiple selected shapes all delete at once
- Deleted shapes cannot be recovered (no undo in Phase 2)
- Delete with no selection does nothing

---

### 📚 Feature 7: Layer Ordering (Z-Index)

**WHY:** Control which shapes appear on top when they overlap.

**Test Layer Order:**
1. ✅ Create 3 overlapping rectangles at the same position (x=200, y=200)
   - Rectangle 1: x=200, y=200
   - Rectangle 2: x=220, y=220
   - Rectangle 3: x=240, y=240
2. ✅ They should stack in creation order (last created is on top)

**Test Bring to Front:**
1. ✅ Open browser DevTools Console (F12)
2. ✅ Paste this code to test:
```javascript
// Get the canvas store
const store = window.useCanvasStore?.getState()

// Bring first shape to front
const firstShapeId = Array.from(store.shapes.keys())[0]
store.bringToFront(firstShapeId)
```
3. ✅ The first shape should now appear on top

**Test Send to Back:**
1. ✅ Paste this in console:
```javascript
const store = window.useCanvasStore?.getState()
const lastShapeId = Array.from(store.shapes.keys()).slice(-1)[0]
store.sendToBack(lastShapeId)
```
2. ✅ The last shape should now appear at the bottom

**Expected Result:**
- Shapes render in correct zIndex order
- Higher zIndex shapes appear on top
- bringToFront makes shape appear above all others
- sendToBack makes shape appear below all others

**Note:** In Phase 2, we test layer ordering via code. In Phase 3+, we'll add UI buttons for this.

---

### 🎹 Feature 8: All Keyboard Shortcuts

**WHY:** Efficient workflows use keyboard shortcuts.

**Test All Shortcuts:**
1. ✅ **Space + Drag** → Pan the canvas
2. ✅ **Mouse Wheel** → Zoom in/out
3. ✅ **Shift + Click** → Multi-select shapes
4. ✅ **Delete** → Remove selected shapes
5. ✅ **Backspace** → Remove selected shapes (Mac)

**Expected Result:**
- All keyboard shortcuts work consistently
- No conflict between shortcuts
- Visual feedback for each action

---

## 🎯 Complete Feature Checklist

Print this out or keep it visible while testing:

### Navigation (4 tests)
- [ ] Pan by dragging canvas
- [ ] Pan with Space+drag
- [ ] Zoom with mouse wheel
- [ ] Zoom centers on cursor

### Shape Creation (4 types × 2 methods = 8 tests)
- [ ] Create rectangle (click)
- [ ] Create rectangle (drag)
- [ ] Create circle (click)
- [ ] Create circle (drag)
- [ ] Create line (click)
- [ ] Create line (drag)
- [ ] Create text (click)
- [ ] Text appears immediately

### Selection (5 tests)
- [ ] Single select by clicking
- [ ] Deselect by clicking canvas
- [ ] Multi-select with Shift+click
- [ ] Shift+click toggles selection
- [ ] Selected shapes show blue outline

### Movement (3 tests)
- [ ] Drag single shape
- [ ] Drag multiple shapes together
- [ ] Unselected shapes don't move

### Resizing (6 tests)
- [ ] 8 resize handles appear when selected
- [ ] Corner handles resize diagonally
- [ ] Edge handles resize one dimension
- [ ] Cursor changes on hover
- [ ] Minimum size enforced
- [ ] Shape updates smoothly

### Deletion (4 tests)
- [ ] Delete key removes shape
- [ ] Backspace key removes shape
- [ ] Delete multiple selected shapes
- [ ] Delete with no selection does nothing

### Layer Order (3 tests)
- [ ] Shapes render in zIndex order
- [ ] bringToFront moves to top
- [ ] sendToBack moves to bottom

**Total: 33 manual tests to verify all Phase 2 features!**

---

## 🐛 Common Issues & Solutions

### Issue: Canvas is blank / Nothing appears
**Solution:** 
- Check browser console (F12) for errors
- Make sure you ran `npm install` before `npm run dev`
- Try refreshing the page (Cmd+R or Ctrl+R)

### Issue: Shapes are created but I can't see them
**Solution:**
- Try zooming out (scroll wheel down)
- Try panning around (Space+drag)
- Check if you're creating shapes outside the visible area

### Issue: Can't select shapes
**Solution:**
- Make sure you clicked the "Select" tool (cursor icon) in toolbar
- Try clicking directly on the shape's fill area, not just the edge

### Issue: Delete key doesn't work
**Solution:**
- Make sure a shape is selected (should have blue outline)
- Check that you're not focused on a text input
- Try Backspace key instead (especially on Mac)

### Issue: Resize handles don't appear
**Solution:**
- Make sure shape is selected (click it first)
- Make sure you're using Select tool (not a shape creation tool)
- Try deselecting and reselecting

---

## 📸 What Success Looks Like

After testing, you should be able to:
1. ✅ Create a design with multiple shapes
2. ✅ Move shapes around freely
3. ✅ Resize shapes to any size
4. ✅ Select multiple shapes and move them together
5. ✅ Delete shapes you don't want
6. ✅ Pan and zoom to see your whole design
7. ✅ Use keyboard shortcuts efficiently

**Example Test Scenario:**
1. Create 3 rectangles
2. Create 2 circles
3. Select all 5 shapes (Shift+click each one)
4. Move them all together
5. Deselect all
6. Select just the circles
7. Resize one circle
8. Delete the other circle
9. Pan and zoom around

If you can do all that smoothly, Phase 2 is working perfectly! 🎉

---

## 🎥 Optional: Record Your Testing

Want to save your testing session?
- **Mac:** Cmd+Shift+5 to record screen
- **Windows:** Win+G for Game Bar recording
- Share your canvas creations!

---

## 🚀 Next Steps

After testing Phase 2:
- **Phase 3:** Real-time collaboration (multiple users on same canvas)
- **Phase 4:** Backend persistence (save your designs)
- **Phase 5:** Authentication (user accounts)
- **Phase 6:** AI assistant (natural language commands)

---

## 💡 Tips for Testing

1. **Test systematically** - Go through each feature in order
2. **Try edge cases** - What happens if you zoom way in? Create 100 shapes?
3. **Test combinations** - Pan while zoomed, resize multiple shapes, etc.
4. **Use shortcuts** - They make testing faster and more fun
5. **Have fun!** - This is YOUR canvas playground! 🎨

---

**Happy Testing!** If you find any bugs or have questions, check the browser console (F12) for error messages.

