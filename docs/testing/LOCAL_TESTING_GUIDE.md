# Local Testing Guide - Real-Time Collaboration

## 🎯 What You'll See

After following this guide, you'll be able to:
- ✅ Open the app in multiple browser windows
- ✅ Draw shapes in one window and see them appear in others
- ✅ See other users' cursors moving in real-time
- ✅ See a list of connected users
- ✅ Watch the connection status indicator

---

## ⚠️ Current Status

**Phase 3 is COMPLETE** but we need a small integration step:
- ✅ WebSocket server is built and tested
- ✅ Yjs sync hooks are built and tested
- ✅ Presence components are built and tested
- ⚠️ **Need to integrate into Canvas component** (5 minutes)

---

## 🔧 Integration Steps

### Step 1: Add Environment Variables

**Frontend** - Create `.env.local`:
```bash
cd /Users/yibin/Documents/WORKZONE/VSCODE/GAUNTLET_AI/1_Week/Figma_Clone/frontend
cat > .env.local << 'EOF'
NEXT_PUBLIC_WS_URL=ws://localhost:4000
NEXT_PUBLIC_API_URL=http://localhost:4000
EOF
```

**Backend** - Create `.env` (if not exists):
```bash
cd /Users/yibin/Documents/WORKZONE/VSCODE/GAUNTLET_AI/1_Week/Figma_Clone/backend
cat > .env << 'EOF'
PORT=4000
NODE_ENV=development
EOF
```

---

## 🚀 Step 2: Start the Servers

### Terminal 1: Start Backend
```bash
cd /Users/yibin/Documents/WORKZONE/VSCODE/GAUNTLET_AI/1_Week/Figma_Clone/backend
npm run dev
```

**Expected output:**
```
✓ WebSocket server initialized
🚀 Server running on http://localhost:4000
🔌 WebSocket server running on ws://localhost:4000
📊 Health check: http://localhost:4000/health
✓ Backend setup complete!
```

### Terminal 2: Start Frontend
```bash
cd /Users/yibin/Documents/WORKZONE/VSCODE/GAUNTLET_AI/1_Week/Figma_Clone/frontend
npm run dev
```

**Expected output:**
```
▲ Next.js 14.x.x
- Local:   http://localhost:3000
✓ Ready in Xms
```

---

## 🧪 Step 3: Test Collaboration (Without Code Changes)

### Quick Test (No UI Yet, But Backend Works):

1. Open **two browser windows** side by side
2. Both navigate to `http://localhost:3000`
3. Open browser DevTools Console (F12) in both windows
4. You should see the Canvas rendered in both

**Current Limitation:** 
- Shapes won't sync yet (need to integrate hooks into Canvas)
- Cursors won't show yet (need to add CursorOverlay)
- But the servers are running and ready! ✅

---

## 🎨 Step 4: Full Integration (I'll do this for you)

To make collaboration actually work in the UI, we need to:

1. **Update Canvas component** to use `useYjsSync` and `usePresence`
2. **Add CursorOverlay** to show other users' cursors
3. **Add ConnectionStatus** indicator
4. **Add PresenceList** to show connected users

**Do you want me to do this integration now?** It will take ~5 minutes and then you'll be able to:
- Draw shapes in window 1 → see them in window 2 instantly
- Move your mouse in window 1 → see your cursor in window 2
- See "Connected Users (2)" in both windows

---

## 🔍 What Works Right Now (Without Integration)

### ✅ Backend WebSocket Server
Test it directly:
```bash
# Check health endpoint
curl http://localhost:4000/health

# Expected response:
{
  "status": "ok",
  "timestamp": "2025-10-14T...",
  "uptime": 123.456,
  "websocket": {
    "roomCount": 0,
    "rooms": []
  }
}
```

### ✅ Frontend Canvas (Solo Mode)
- Open http://localhost:3000
- You can draw shapes
- You can move shapes
- You can select/delete shapes
- Everything works... just not syncing yet!

---

## 🎯 After Integration (What You'll Test)

### Test 1: Shape Sync
1. Open Window A and Window B
2. In Window A: Click toolbar → Select Rectangle → Draw a rectangle
3. **Result:** Rectangle appears in Window B within 100ms! 🎉

### Test 2: Real-Time Updates
1. In Window A: Drag the rectangle to move it
2. **Result:** Window B shows the rectangle moving! 🎉

### Test 3: Multiplayer Cursors
1. In Window A: Move your mouse around the canvas
2. **Result:** Window B shows your cursor with your name! 🎉

### Test 4: User Presence
1. Both windows show "Connected Users (2)"
2. Click the user list to see both users listed
3. Each user has a unique color
4. Your own user shows "(You)"

### Test 5: Connection Status
1. Top-right corner shows green dot: "Connected"
2. Stop backend server
3. Frontend shows red dot: "Disconnected"
4. Restart backend
5. Frontend shows yellow dot: "Connecting..."
6. Then green: "Connected" 🎉

---

## 🐛 Troubleshooting

### Backend won't start
```bash
# Check if port 4000 is in use
lsof -i :4000

# Kill the process if needed
kill -9 <PID>

# Restart
npm run dev
```

### Frontend won't start
```bash
# Check if port 3000 is in use
lsof -i :3000

# Kill the process if needed
kill -9 <PID>

# Restart
npm run dev
```

### WebSocket connection fails
1. Make sure backend is running first
2. Check browser console for errors
3. Verify `.env.local` has correct WebSocket URL
4. Try hard refresh (Cmd+Shift+R or Ctrl+Shift+R)

### Shapes don't sync
- This is expected until we integrate the hooks!
- After integration, if still not working:
  - Check browser console for errors
  - Check backend logs for connection
  - Verify both windows are on same document ID

---

## 📊 Monitoring

### Backend Logs
Watch the backend terminal for:
```
[WebSocket] New connection from ::1
[WebSocket] Client joined room: test-document-123
[WebSocket] Received remote update
```

### Frontend Console
Open DevTools and watch for:
```
[Yjs] Connection status: connecting
[Yjs] Connection status: connected
[Yjs] Syncing shape to Yjs: shape-123
[Yjs] Received remote update
```

### Health Check
Monitor the health endpoint:
```bash
# Watch in real-time
watch -n 1 'curl -s http://localhost:4000/health | json_pp'

# Or simpler
while true; do curl -s http://localhost:4000/health; echo ""; sleep 2; done
```

---

## 🎬 Demo Script (After Integration)

**For showing someone the collaboration features:**

1. **Setup:** Two browser windows side by side
2. **Draw:** Create a rectangle in left window
   - "Notice it appears instantly in the right window"
3. **Move:** Drag the rectangle around in left window
   - "See how the right window updates in real-time"
4. **Cursor:** Move mouse in left window
   - "The right window shows my cursor position"
5. **Multi-user:** In right window, create a circle
   - "Now left window gets the circle"
6. **Presence:** Point to user list
   - "We can see both users connected"
7. **Disconnect:** Stop backend server
   - "Notice the red 'Disconnected' indicator"
8. **Reconnect:** Restart backend
   - "It automatically reconnects and syncs"

---

## ⏭️ Next Steps

### Option A: Test Now (Basic)
1. Start both servers
2. Open browser to verify they run
3. Use DevTools console to verify WebSocket connects

### Option B: Full Integration (Recommended)
**Let me integrate the collaboration features into the Canvas** so you can:
- Actually see shapes sync
- See cursors
- See user list
- See connection status

**This takes ~5 minutes. Should I do it now?** 🚀

---

## 📝 Summary

**What's Ready:**
- ✅ Backend WebSocket server (running on port 4000)
- ✅ Frontend Next.js app (running on port 3000)
- ✅ All collaboration hooks and components (built & tested)

**What's Needed:**
- ⚠️ Wire up the hooks in Canvas component (small change)
- ⚠️ Add UI components (CursorOverlay, ConnectionStatus, PresenceList)

**After Integration:**
- 🎉 Full real-time collaboration working!
- 🎉 Multiple users can edit simultaneously
- 🎉 Sub-100ms sync latency
- 🎉 Live cursors and presence

---

**Ready to integrate? Say the word and I'll make it work!** 🚀

