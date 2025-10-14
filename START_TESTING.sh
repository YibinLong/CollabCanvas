#!/bin/bash

# Phase 2 Canvas Testing - Quick Start Script
# This script launches the frontend so you can test all canvas features

echo "🎨 ============================================"
echo "   CollabCanvas - Phase 2 Testing"
echo "============================================"
echo ""
echo "Starting the frontend development server..."
echo ""

cd "$(dirname "$0")/frontend"

# Check if node_modules exists
if [ ! -d "node_modules" ]; then
    echo "📦 Installing dependencies (first time only)..."
    npm install
    echo ""
fi

echo "🚀 Starting Next.js development server..."
echo ""
echo "Once it starts, open your browser to:"
echo "   👉 http://localhost:3000"
echo ""
echo "📖 See TESTING_PHASE2.md for complete testing guide"
echo ""
echo "Press Ctrl+C to stop the server"
echo ""
echo "============================================"
echo ""

npm run dev

