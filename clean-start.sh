#!/bin/bash

# Clean Start Script for Figma Clone
# This script ensures no old processes are running before starting servers

echo "🧹 Cleaning up old processes..."

# Kill any running backend processes
pkill -f "tsx watch src/server.ts" 2>/dev/null && echo "  ✅ Killed old backend processes"

# Kill any running Next.js frontend processes  
pkill -f "next dev" 2>/dev/null && echo "  ✅ Killed old frontend processes"

# Wait a moment for processes to fully terminate
sleep 2

# Check if ports are free
if lsof -i :4000 > /dev/null 2>&1; then
    echo "  ⚠️  Port 4000 still in use! Killing process..."
    lsof -ti :4000 | xargs kill -9
fi

if lsof -i :3000 > /dev/null 2>&1; then
    echo "  ⚠️  Port 3000 still in use! Killing process..."
    lsof -ti :3000 | xargs kill -9
fi

echo ""
echo "✨ All clean! Ports 3000 and 4000 are now free."
echo ""
echo "⚠️  IMPORTANT: Close ALL browser tabs with localhost:3000"
echo "   - Close tabs in Chrome, Safari, Firefox, etc."
echo "   - Or use the script below to clear browser data"
echo ""
echo "🔥 Quick fix: Run this AppleScript to close browser tabs:"
echo '   osascript -e '"'"'tell application "Safari" to close (every tab of every window whose URL contains "localhost:3000")'"'"
echo '   osascript -e '"'"'tell application "Google Chrome" to close (every tab of every window whose URL contains "localhost:3000")'"'"
echo ""
echo "📋 Next steps:"
echo "   1. Start backend:  cd backend && npm run dev"
echo "   2. Start frontend: cd frontend && npm run dev"
echo "   3. Open NEW incognito/private window"
echo "   4. Navigate to http://localhost:3000 and sign in"
echo ""

