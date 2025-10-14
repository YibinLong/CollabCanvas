#!/bin/bash

# Quick Deploy Script - Deploy Frontend to Vercel NOW!
# This deploys ONLY the Phase 2 canvas (no backend needed yet)

echo "🚀 ================================================"
echo "   CollabCanvas - Quick Deploy to Vercel"
echo "================================================"
echo ""
echo "📦 What will be deployed:"
echo "   ✅ Phase 2 Canvas (shapes, pan, zoom, etc.)"
echo "   ❌ Backend (not built yet - Phase 4)"
echo "   ❌ Database (not needed yet - Phase 4)"
echo "   ❌ Auth (not needed yet - Phase 5)"
echo ""
echo "⏱️  This will take about 2-3 minutes"
echo ""

# Check if we're in the right directory
if [ ! -d "frontend" ]; then
    echo "❌ Error: Must run from project root"
    echo "   Current: $(pwd)"
    echo "   Expected: .../Figma_Clone/"
    exit 1
fi

# Navigate to frontend
cd frontend

# Check if Vercel CLI is installed
if ! command -v vercel &> /dev/null; then
    echo "📥 Installing Vercel CLI..."
    npm install -g vercel
fi

echo ""
echo "🔐 Step 1: Login to Vercel"
echo "   (Browser will open for authentication)"
echo ""
vercel login

if [ $? -ne 0 ]; then
    echo "❌ Login failed. Please try again."
    exit 1
fi

echo ""
echo "✅ Logged in successfully!"
echo ""
echo "🏗️  Step 2: Deploying to production..."
echo "   (This may take 2-3 minutes)"
echo ""

# Deploy to production
vercel --prod

if [ $? -eq 0 ]; then
    echo ""
    echo "🎉 ================================================"
    echo "   DEPLOYMENT SUCCESSFUL!"
    echo "================================================"
    echo ""
    echo "✅ Your canvas is now live!"
    echo ""
    echo "📋 Next steps:"
    echo "   1. Open the URL shown above"
    echo "   2. Test all features (create, move, resize shapes)"
    echo "   3. Share the URL with friends!"
    echo ""
    echo "⚠️  Note: Shapes won't persist after refresh"
    echo "   (We need to build the backend first - Phase 4)"
    echo ""
    echo "🚀 To deploy updates:"
    echo "   cd frontend && vercel --prod"
    echo ""
else
    echo ""
    echo "❌ Deployment failed!"
    echo ""
    echo "🔍 Troubleshooting:"
    echo "   1. Check build errors above"
    echo "   2. Make sure 'npm run build' works locally"
    echo "   3. See DEPLOYMENT_GUIDE.md for help"
    echo ""
fi

