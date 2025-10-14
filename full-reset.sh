#!/bin/bash

# Full Reset Script - Cleans EVERYTHING
# Use this when you have weird authentication issues

echo "🔥 FULL RESET - Cleaning everything..."
echo ""

# 1. Kill all processes
echo "1️⃣  Killing all backend/frontend processes..."
pkill -f "tsx watch src/server.ts" 2>/dev/null && echo "   ✅ Backend killed"
pkill -f "next dev" 2>/dev/null && echo "   ✅ Frontend killed"
sleep 1

# 2. Free up ports
echo ""
echo "2️⃣  Freeing ports 3000 and 4000..."
lsof -ti :4000 2>/dev/null | xargs kill -9 2>/dev/null && echo "   ✅ Port 4000 freed"
lsof -ti :3000 2>/dev/null | xargs kill -9 2>/dev/null && echo "   ✅ Port 3000 freed"
sleep 1

# 3. Close browser tabs
echo ""
echo "3️⃣  Closing browser tabs..."
osascript -e 'tell application "Safari" to close (every tab of every window whose URL contains "localhost:3000")' 2>/dev/null && echo "   ✅ Safari tabs closed"
osascript -e 'tell application "Google Chrome" to close (every tab of every window whose URL contains "localhost:3000")' 2>/dev/null && echo "   ✅ Chrome tabs closed"
osascript -e 'tell application "Brave Browser" to close (every tab of every window whose URL contains "localhost:3000")' 2>/dev/null
osascript -e 'tell application "Firefox" to close (every window whose URL contains "localhost:3000")' 2>/dev/null
sleep 1

echo ""
echo "✨ ✨ ✨  FULL RESET COMPLETE  ✨ ✨ ✨"
echo ""
echo "📝 NOW DO THIS:"
echo ""
echo "   1. Terminal 1: cd backend && npm run dev"
echo "   2. Terminal 2: cd frontend && npm run dev"
echo "   3. Open NEW INCOGNITO WINDOW"
echo "   4. Go to: http://localhost:3000"
echo "   5. Sign in with your email/password"
echo ""
echo "🚨 DO NOT open regular browser tabs - use incognito only!"
echo ""

