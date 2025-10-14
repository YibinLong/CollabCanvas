# Troubleshooting Guide

## Problem: "Invalid or expired token" errors when starting backend

### What Was Happening

When you started the backend server, you immediately saw multiple authentication failures:

```
[WebSocket] New connection from ::1
[WebSocket] Authentication failed: Error: Invalid or expired token
```

### Root Causes

1. **Multiple Backend Instances Running** ⚠️
   - You had **3+ backend servers** running from previous sessions (9:31 AM, 9:12 PM, 6:18 PM)
   - Each old instance was trying to reconnect with expired tokens
   - Solution: Kill all old processes before starting new ones

2. **Browser Tabs with Old Sessions** 🌐
   - Browser tabs might have the app open with expired tokens stored in localStorage
   - These tabs try to reconnect automatically when backend starts
   - Solution: Close all browser tabs and clear site data

3. **Frontend Auto-Connect** 🔌
   - The Canvas component was trying to connect even when user wasn't logged in
   - Solution: Added authentication gate (`!!user` check) before connecting

### The Fix

#### 1. Enhanced Logging
- **Backend**: Now shows detailed connection attempts with:
  - Remote address
  - Request URL
  - Token presence
  - User agent
  - Origin

- **Frontend**: Shows Yjs sync lifecycle:
  - When sync is enabled/disabled
  - Token fetching status
  - WebSocket provider creation

#### 2. Clean Start Script
Run this before starting your servers:

```bash
./clean-start.sh
```

This script:
- Kills all old backend/frontend processes
- Frees ports 3000 and 4000
- Gives you a clean slate

#### 3. Authentication Gate
The Canvas component now only connects to WebSocket when a user is authenticated:

```typescript
const { user } = useAuth()
const { connected, status, provider } = useYjsSync(documentId, undefined, !!user)
```

**Before**: Connected immediately, even on login page
**After**: Only connects after successful login

#### 4. Token Refresh
Updated `getAuthToken()` to always refresh the session:

```typescript
export async function getAuthToken() {
  const { data, error } = await supabase.auth.refreshSession()
  // ... returns fresh token
}
```

**Before**: Returned stale token from localStorage
**After**: Always gets a fresh token from Supabase

---

## Proper Startup Procedure

### Step 1: Clean Up
```bash
./clean-start.sh
```

### Step 2: Start Backend (in terminal 1)
```bash
cd backend
npm run dev
```

**Wait for**:
```
✓ Backend setup complete!
```

### Step 3: Start Frontend (in terminal 2)
```bash
cd frontend
npm run dev
```

**Wait for**:
```
✓ Ready in 2s
○ Local: http://localhost:3000
```

### Step 4: Browser Setup
1. Open **new incognito/private window** (or clear cookies)
2. Navigate to `http://localhost:3000`
3. Sign in with your credentials
4. Check console - you should see:

**Frontend Console**:
```
[useYjsSync] Effect triggered. Enabled: true
[useYjsSync] 🔑 Fetching auth token...
[useYjsSync] ✅ Got auth token (first 20 chars): eyJhbGciOiJIUzI1NiIs...
[useYjsSync] 🔌 Creating WebSocket provider...
[Yjs] Connection status: connected
```

**Backend Terminal**:
```
========================================
[WebSocket] 🔌 NEW CONNECTION ATTEMPT
[WebSocket] Remote Address: ::1
[WebSocket] Request URL: /test-document-123?token=eyJ...
[WebSocket] 🔍 Token present: true
[WebSocket] 🔐 Verifying token with Supabase...
[WebSocket] ✅ Authenticated user: your-email@example.com (user-id)
========================================
```

---

## Common Issues

### Issue: Still seeing "Invalid token" errors

**Check**:
1. Are there still old processes running?
   ```bash
   ps aux | grep -E "(tsx|next)" | grep -v grep
   ```
   If yes, run `./clean-start.sh` again

2. Are there browser tabs open with localhost:3000?
   - Close ALL tabs with the app
   - Clear site data (Cmd+Shift+Delete)

3. Is the frontend trying to connect before login?
   - Check browser console for `[useYjsSync] Sync is DISABLED`
   - Should see this message on login page

### Issue: Connection keeps disconnecting/reconnecting

**Symptoms**:
```
[Yjs] Connection status: connected
[Yjs] Connection status: disconnected
[Yjs] Connection status: connecting
```

**Causes**:
1. Token is expiring too quickly
2. Network issues
3. Backend restarting

**Fix**:
1. Sign out and sign back in (gets fresh token)
2. Check backend terminal for errors
3. Check if backend is in watch mode and recompiling

### Issue: "No auth token available"

**Frontend shows**:
```
[useYjsSync] ❌ No auth token available
```

**Cause**: User is not logged in, or session expired

**Fix**:
1. Sign out completely
2. Close browser tab
3. Open new tab and sign in again

---

## Debugging Tips

### 1. Check Backend Logs
The detailed logging now shows:
- Every connection attempt
- Token validation status
- User authentication success/failure

### 2. Check Frontend Console
Look for the `[useYjsSync]` logs:
- Is sync enabled? (`Enabled: true/false`)
- Did it fetch a token? (`✅ Got auth token`)
- Did it create provider? (`✅ WebSocket provider created`)

### 3. Check Network Tab
In browser DevTools → Network → WS (WebSockets):
- Should see connection to `ws://localhost:4000/test-document-123?token=...`
- Status should be "101 Switching Protocols" (success)
- If you see 4401 or 4403, authentication failed

### 4. Verify Ports
```bash
lsof -i :3000  # Check frontend
lsof -i :4000  # Check backend
```

Should each show only ONE process.

---

## Prevention

### Always use clean-start.sh
Make it a habit to run `./clean-start.sh` before starting development.

### Use tmux or screen
Create a tmux session with two panes:
```bash
tmux new -s figma
# Split pane: Ctrl+B then "
# Top pane: cd backend && npm run dev
# Bottom pane: cd frontend && npm run dev
```

### Add to your shell profile
```bash
# ~/.zshrc or ~/.bashrc
alias figma-clean="cd ~/path/to/Figma_Clone && ./clean-start.sh"
alias figma-start="figma-clean && cd backend && npm run dev"
```

---

## Understanding the Error

### Why "Invalid or expired token"?

JWT tokens have an expiration time (usually 1 hour). When:
1. You leave the app open overnight
2. Close your laptop and come back later
3. The token expires but is still in localStorage

The app tries to use this expired token → Backend rejects it → Error spam

### Why multiple connections?

When backend starts and frontend is already open:
1. Frontend detects backend is online
2. Tries to reconnect immediately
3. If you have multiple tabs open, each tries to connect
4. Old backend instances might also try to connect to new backend

Result: Connection storm with expired tokens

---

## Need More Help?

1. Check the detailed logs (backend and frontend console)
2. Run `./clean-start.sh` to ensure clean state
3. Try incognito mode to rule out browser cache issues
4. Check if Supabase is configured correctly (`.env.local` files)

