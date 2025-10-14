# 🚀 CollabCanvas - Deployment Guide

## 📍 Current Status: Phase 2 Complete

**What We Have:**
- ✅ Frontend Canvas (Phase 2) - Ready to deploy!
- ✅ Shape creation, selection, movement, resizing
- ✅ Pan, zoom, multi-select, delete, layers

**What We Don't Have Yet:**
- ❌ Backend server (Phase 4)
- ❌ Database (Phase 4)
- ❌ Authentication (Phase 5)
- ❌ Real-time collaboration (Phase 3)
- ❌ AI features (Phase 6)

---

## 🎯 Option 1: Deploy Frontend Only (NOW)

**What You Get:**
- Live canvas at a public URL
- All Phase 2 features working
- Can share with others to try out
- Shapes are NOT saved (no backend yet)

### Step-by-Step: Deploy to Vercel

#### 1️⃣ Create Vercel Account

1. Go to [vercel.com](https://vercel.com)
2. Click "Sign Up"
3. Sign up with GitHub (recommended - easiest)
4. Authorize Vercel to access your GitHub

#### 2️⃣ Push Your Code to GitHub

```bash
# Navigate to project
cd /Users/yibin/Documents/WORKZONE/VSCODE/GAUNTLET_AI/1_Week/Figma_Clone

# Initialize git (if not already done)
git init

# Add all files
git add .

# Commit
git commit -m "Phase 2 complete - Canvas features ready for deployment"

# Create a new repository on GitHub (github.com/new)
# Name it: collabcanvas or figma-clone

# Add remote (replace YOUR_USERNAME with your GitHub username)
git remote add origin https://github.com/YOUR_USERNAME/collabcanvas.git

# Push to GitHub
git push -u origin main
```

#### 3️⃣ Deploy to Vercel

**Via Vercel Dashboard:**

1. Go to [vercel.com/new](https://vercel.com/new)
2. Click "Import Git Repository"
3. Find your `collabcanvas` repository
4. Click "Import"
5. Configure project:
   - **Framework Preset:** Next.js (auto-detected)
   - **Root Directory:** `frontend`
   - **Build Command:** `npm run build` (default)
   - **Output Directory:** `.next` (default)
   - **Install Command:** `npm install` (default)

6. **Environment Variables:** (none needed for Phase 2!)
   - Skip this section for now

7. Click "Deploy"

8. Wait 2-3 minutes for deployment

9. Get your URL: `https://collabcanvas-xxxxx.vercel.app`

**Via Vercel CLI (Alternative):**

```bash
# Install Vercel CLI
npm install -g vercel

# Navigate to frontend
cd /Users/yibin/Documents/WORKZONE/VSCODE/GAUNTLET_AI/1_Week/Figma_Clone/frontend

# Login to Vercel
vercel login

# Deploy
vercel

# Follow prompts:
# - Set up and deploy? Y
# - Which scope? (your account)
# - Link to existing project? N
# - Project name? collabcanvas-frontend
# - Directory? ./ (current)
# - Override settings? N

# Deploy to production
vercel --prod
```

#### 4️⃣ Test Your Deployment

1. Open the Vercel URL in your browser
2. Test all features:
   - ✅ Create shapes (rectangle, circle, line, text)
   - ✅ Move shapes
   - ✅ Resize shapes
   - ✅ Multi-select (Shift+click)
   - ✅ Delete shapes
   - ✅ Pan and zoom

**Note:** Shapes will NOT persist after refresh (no backend/database yet)

---

## 🎯 Option 2: Full Deployment (AFTER Phase 5)

This is what we'll do AFTER completing Phases 3, 4, and 5.

### Overview

```
Frontend (Vercel)
    ↓
Backend (Render)
    ↓
Database (Supabase)
```

### What You'll Need Later

1. **Supabase Account** (Free tier available)
   - Provides: PostgreSQL database + Authentication
   - Sign up: [supabase.com](https://supabase.com)

2. **Render Account** (Free tier available)
   - Provides: Backend hosting
   - Sign up: [render.com](https://render.com)

3. **OpenAI Account** (Paid - for AI features in Phase 6)
   - Provides: AI assistant functionality
   - Sign up: [platform.openai.com](https://platform.openai.com)

---

## 📝 Environment Variables Guide (For Future)

When we build the backend and add features, you'll need these:

### Frontend `.env.local`

```bash
# Location: /frontend/.env.local

# Backend API (from Render - Phase 4)
NEXT_PUBLIC_API_URL=https://your-backend.onrender.com

# WebSocket server (from Render - Phase 3)
NEXT_PUBLIC_WS_URL=wss://your-backend.onrender.com

# Supabase (Phase 5)
NEXT_PUBLIC_SUPABASE_URL=https://xxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

**Where to Find These:**

1. **NEXT_PUBLIC_API_URL & NEXT_PUBLIC_WS_URL:**
   - Deploy backend to Render first (Phase 4)
   - Copy the URL from Render dashboard
   - Format: `https://collabcanvas-backend.onrender.com`

2. **NEXT_PUBLIC_SUPABASE_URL:**
   - Supabase Dashboard → Settings → API
   - Copy "Project URL"

3. **NEXT_PUBLIC_SUPABASE_ANON_KEY:**
   - Supabase Dashboard → Settings → API
   - Copy "anon public" key

### Backend `.env`

```bash
# Location: /backend/.env

# Database (from Supabase - Phase 4)
DATABASE_URL=postgresql://postgres:password@db.xxxxx.supabase.co:5432/postgres

# Supabase (Phase 5)
SUPABASE_URL=https://xxxxx.supabase.co
SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
SUPABASE_SERVICE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

# OpenAI (Phase 6)
OPENAI_API_KEY=sk-proj-xxxxx...

# JWT Secret (generate this)
JWT_SECRET=your_random_secret_here

# Server config
PORT=4000
NODE_ENV=production
```

**Where to Find These:**

1. **DATABASE_URL:**
   - Supabase Dashboard → Settings → Database
   - Copy "Connection string" under "Connection pooling"
   - Replace `[YOUR-PASSWORD]` with your database password

2. **SUPABASE_URL:**
   - Same as frontend

3. **SUPABASE_ANON_KEY:**
   - Same as frontend

4. **SUPABASE_SERVICE_KEY:**
   - Supabase Dashboard → Settings → API
   - Copy "service_role" key
   - ⚠️ **KEEP THIS SECRET!** Never commit to git!

5. **OPENAI_API_KEY:**
   - Go to [platform.openai.com/api-keys](https://platform.openai.com/api-keys)
   - Click "Create new secret key"
   - Copy and save it (you can't see it again!)

6. **JWT_SECRET:**
   - Generate a random string:
   ```bash
   openssl rand -hex 32
   ```
   - Copy the output

---

## 🎬 Quick Deploy Now (Frontend Only)

**Fastest Way to Get Online:**

```bash
# 1. Navigate to project
cd /Users/yibin/Documents/WORKZONE/VSCODE/GAUNTLET_AI/1_Week/Figma_Clone/frontend

# 2. Install Vercel CLI
npm install -g vercel

# 3. Login
vercel login

# 4. Deploy
vercel --prod

# 5. Done! Your URL will be shown in terminal
```

Copy the URL and share it! 🎉

---

## 🐛 Troubleshooting

### Build Fails on Vercel

**Error: "Module not found"**
```bash
# Solution: Make sure all imports use the correct paths
# Check that @/* imports work (they should with Next.js)
```

**Error: "Build exceeded time limit"**
```bash
# Solution: The free tier has a 45-second build limit
# Frontend should build in ~20 seconds, so this is rare
```

### Deployment Works But Canvas is Blank

**Check:**
1. Open browser DevTools (F12)
2. Look for JavaScript errors in Console
3. Check Network tab for failed requests

**Common Issues:**
- Canvas didn't load: Check that `/frontend/components/Canvas.tsx` exists
- Toolbar missing: Check that `/frontend/components/Toolbar.tsx` exists
- White screen: Check browser console for errors

### App Works Locally But Not in Production

**Check:**
1. Make sure you deployed from the `frontend` folder
2. Make sure `package.json` has all dependencies
3. Check Vercel build logs for errors

---

## 📋 Deployment Checklist

### Phase 2 Deployment (NOW)

- [ ] Code is working locally (`npm run dev`)
- [ ] All tests pass (`npm test`)
- [ ] Push code to GitHub
- [ ] Create Vercel account
- [ ] Import repository to Vercel
- [ ] Set root directory to `frontend`
- [ ] Deploy (wait 2-3 minutes)
- [ ] Test live URL
- [ ] Share with friends! 🎉

### Full Deployment (LATER - After Phase 5)

- [ ] Complete Phase 3 (Real-time collaboration)
- [ ] Complete Phase 4 (Backend & Database)
- [ ] Complete Phase 5 (Authentication)
- [ ] Create Supabase project
- [ ] Set up database schema (Prisma migrations)
- [ ] Deploy backend to Render
- [ ] Configure environment variables
- [ ] Test full app (frontend + backend + database)
- [ ] Complete Phase 6 (AI features) - Optional

---

## 🎯 What You Can Do NOW

1. ✅ **Deploy frontend to Vercel** - Live in 5 minutes!
2. ✅ **Share URL with others** - They can try the canvas
3. ✅ **Get feedback** - See what people think
4. ✅ **Continue development** - Build Phases 3-6

**Limitations (until we build backend):**
- ❌ Shapes don't persist after refresh
- ❌ Can't save/load documents
- ❌ No collaboration (one user at a time)
- ❌ No user accounts
- ❌ No AI features

---

## 🚀 Next Steps

### To Get Full App Deployed:

1. **Complete Phase 3: Real-Time Collaboration**
   - Yjs client integration
   - WebSocket server
   - Multiplayer cursors

2. **Complete Phase 4: Backend & Persistence**
   - Express REST API
   - Database setup
   - Document saving

3. **Complete Phase 5: Authentication**
   - Supabase Auth
   - User accounts
   - Protected routes

4. **Full Deployment:**
   - Deploy backend to Render
   - Set up Supabase
   - Connect all pieces
   - Go live! 🎊

---

## 💰 Cost Estimate

### Current (Phase 2 Frontend Only)
- **Vercel:** FREE (Hobby tier)
- **Total:** $0/month

### Full App (After Phase 5)
- **Vercel (Frontend):** FREE (Hobby tier, 100GB bandwidth)
- **Render (Backend):** FREE (Starter tier, sleeps after inactivity) or $7/month (always on)
- **Supabase (Database):** FREE (500MB, 2GB bandwidth) or $25/month (8GB storage)
- **OpenAI (Phase 6):** ~$5-20/month (pay per use)
- **Total:** $0-50/month depending on usage

---

## 🎉 Ready to Deploy?

Run these commands right now:

```bash
cd /Users/yibin/Documents/WORKZONE/VSCODE/GAUNTLET_AI/1_Week/Figma_Clone/frontend
npm install -g vercel
vercel login
vercel --prod
```

Your canvas will be live in 3 minutes! 🚀

**Questions?** Check the troubleshooting section above or see `PRD.md` for more details.

