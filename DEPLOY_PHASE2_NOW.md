# 🚀 Deploy Phase 2 Canvas RIGHT NOW!

## ⚡ 3-Minute Deployment

Your canvas can be live in 3 minutes! No environment variables needed for Phase 2.

---

## Option 1: One-Command Deploy (Easiest!)

```bash
cd /Users/yibin/Documents/WORKZONE/VSCODE/GAUNTLET_AI/1_Week/Figma_Clone
./DEPLOY_NOW.sh
```

That's it! Script will:
1. Install Vercel CLI
2. Login (browser opens)
3. Deploy your canvas
4. Give you a live URL

---

## Option 2: Manual Deploy (5 minutes)

### Step 1: Install Vercel CLI
```bash
npm install -g vercel
```

### Step 2: Navigate to Frontend
```bash
cd /Users/yibin/Documents/WORKZONE/VSCODE/GAUNTLET_AI/1_Week/Figma_Clone/frontend
```

### Step 3: Login
```bash
vercel login
```
(Browser opens for authentication)

### Step 4: Deploy
```bash
vercel --prod
```

### Step 5: Get Your URL
```
🎉 Your canvas is live at:
https://collabcanvas-xxxxx.vercel.app
```

---

## What You Get

✅ **Live canvas** at a public URL  
✅ **All Phase 2 features** working:
- Create shapes (rectangle, circle, line, text)
- Move shapes
- Resize shapes (8 handles)
- Multi-select (Shift+click)
- Delete shapes (Delete key)
- Pan canvas (Space+drag)
- Zoom (mouse wheel)
- Layer ordering

❌ **What's NOT included yet:**
- Shapes don't save after refresh (no backend)
- No user accounts (no auth)
- No collaboration (no WebSocket)
- No AI features

---

## Environment Variables

### Phase 2: ✅ NONE NEEDED!

Your canvas works with **zero configuration**. Just deploy!

### Future Phases: You'll Need

When we build the backend (Phases 3-5), you'll add:

**Frontend `.env.local`:**
```bash
# Phase 3: Real-time
NEXT_PUBLIC_WS_URL=wss://your-backend.onrender.com

# Phase 4: Backend
NEXT_PUBLIC_API_URL=https://your-backend.onrender.com

# Phase 5: Auth (from Supabase Dashboard → Settings → API)
NEXT_PUBLIC_SUPABASE_URL=https://xxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGci...
```

**Backend `.env`:**
```bash
# Phase 4: Database (from Supabase Dashboard → Settings → Database)
DATABASE_URL=postgresql://postgres:[PASSWORD]@db.xxxxx.supabase.co:5432/postgres

# Phase 5: Auth (from Supabase Dashboard → Settings → API)
SUPABASE_URL=https://xxxxx.supabase.co
SUPABASE_ANON_KEY=eyJhbGci...
SUPABASE_SERVICE_KEY=eyJhbGci...  # ⚠️ SECRET! Never expose!
JWT_SECRET=your_random_secret       # Generate: openssl rand -hex 32

# Phase 6: AI (from platform.openai.com/api-keys)
OPENAI_API_KEY=sk-proj-xxxxx...

# Server
PORT=4000
NODE_ENV=production
```

---

## Where to Find Keys (For Later)

### Supabase (Phase 5)
1. Create project at [supabase.com](https://supabase.com)
2. Go to **Settings → API**
3. Copy:
   - **Project URL** → `SUPABASE_URL`
   - **anon public** → `SUPABASE_ANON_KEY`
   - **service_role** → `SUPABASE_SERVICE_KEY` (keep secret!)
4. Go to **Settings → Database**
5. Copy **Connection string** → `DATABASE_URL`

### OpenAI (Phase 6)
1. Go to [platform.openai.com/api-keys](https://platform.openai.com/api-keys)
2. Click **Create new secret key**
3. Copy key → `OPENAI_API_KEY`
4. ⚠️ **Save it!** You can't see it again

### Render Backend URL (Phase 4)
1. Deploy backend to [render.com](https://render.com)
2. Copy URL from dashboard
3. Use for `NEXT_PUBLIC_API_URL` and `NEXT_PUBLIC_WS_URL`

---

## Test Your Deployment

1. Open your Vercel URL
2. Click **Rectangle** tool
3. Draw some shapes
4. Move them around
5. Resize them
6. Delete them
7. Pan and zoom

✅ All working? **You're live!** 🎉

---

## Cost

**Phase 2 (now):** **$0/month**
- Vercel: FREE (Hobby tier)

**Full app (later):** **$0-50/month**
- Vercel: FREE
- Render: FREE or $7/month
- Supabase: FREE or $25/month
- OpenAI: $5-20/month (usage-based)

---

## Next Steps

### After Deploying:
1. ✅ Share URL with friends
2. ✅ Get feedback
3. ✅ Continue building Phases 3-6
4. ✅ Deploy full app when ready

### To Update Your Deployment:
```bash
cd /Users/yibin/Documents/WORKZONE/VSCODE/GAUNTLET_AI/1_Week/Figma_Clone/frontend
vercel --prod
```

---

## Troubleshooting

### "Command not found: vercel"
```bash
npm install -g vercel
```

### Build fails on Vercel
1. Test locally: `npm run build`
2. Check error message
3. Fix code, commit, redeploy

### Canvas is blank
1. Open DevTools (F12)
2. Check Console for errors
3. Check that root directory is set to `frontend` in Vercel

---

## 🎯 Deploy Right Now

Run this:
```bash
cd /Users/yibin/Documents/WORKZONE/VSCODE/GAUNTLET_AI/1_Week/Figma_Clone
./DEPLOY_NOW.sh
```

Or manually:
```bash
cd /Users/yibin/Documents/WORKZONE/VSCODE/GAUNTLET_AI/1_Week/Figma_Clone/frontend
npm install -g vercel
vercel login
vercel --prod
```

**Your canvas will be live in 3 minutes!** 🚀

---

For complete deployment guide including full-stack deployment (Phases 3-6), see **DEPLOYMENT_GUIDE.md**

