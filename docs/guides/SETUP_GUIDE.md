# Setup Guide - Getting Started with CollabCanvas

This guide walks you through setting up the development environment step by step.

## 🎯 Overview

CollabCanvas consists of two main parts:
1. **Frontend** (Next.js) - The user interface
2. **Backend** (Node.js/Express) - The API and WebSocket server

Both need to run simultaneously for the app to work.

## 📋 Prerequisites

Before starting, make sure you have:

- [ ] **Node.js 18+** installed ([download](https://nodejs.org/))
- [ ] **npm** (comes with Node.js)
- [ ] **Git** for version control
- [ ] A code editor (VS Code recommended)

You'll need these later:
- [ ] **Supabase account** (for auth and database) - Sign up at [supabase.com](https://supabase.com)
- [ ] **OpenAI API key** (for AI features) - Get from [platform.openai.com](https://platform.openai.com)

## 🚀 Step-by-Step Setup

### Step 1: Verify Node.js Installation

```bash
node --version  # Should be v18.0.0 or higher
npm --version   # Should be 9.0.0 or higher
```

### Step 2: Install Frontend Dependencies

```bash
cd frontend
npm install
```

**What this does:**
- Downloads all packages listed in `package.json`
- Installs React, Next.js, Yjs, Zustand, TailwindCSS, etc.
- Creates `node_modules/` folder (ignored by Git)

**Expected output:**
```
added 324 packages, and audited 325 packages in 45s
```

### Step 3: Install Backend Dependencies

```bash
cd ../backend
npm install
```

**What this does:**
- Downloads Express, Yjs, Prisma, OpenAI SDK, etc.
- Creates `node_modules/` folder

### Step 4: Set Up Environment Variables

#### Frontend Environment

```bash
cd frontend
cp .env.example .env.local
```

Edit `.env.local` with your values:

```env
# For now, use these local development values:
NEXT_PUBLIC_API_URL=http://localhost:4000
NEXT_PUBLIC_WS_URL=ws://localhost:4001

# Leave these blank for now (will add in PR #21):
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
```

#### Backend Environment

```bash
cd ../backend
cp .env.example .env
```

Edit `.env` with your values:

```env
# Server config
PORT=4000
NODE_ENV=development
FRONTEND_URL=http://localhost:3000

# Leave these blank for now (will add in later PRs):
DATABASE_URL=
SUPABASE_URL=
SUPABASE_SERVICE_KEY=
OPENAI_API_KEY=
```

### Step 5: Test the Setup

#### Start the Backend

```bash
cd backend
npm run dev
```

**Expected output:**
```
🚀 Server running on http://localhost:4000
📊 Health check: http://localhost:4000/health

✓ Backend setup complete!
```

**✅ Success indicators:**
- No error messages
- You see the rocket emoji
- Server is listening on port 4000

#### Test Backend Health Check

Open a new terminal and run:

```bash
curl http://localhost:4000/health
```

**Expected response:**
```json
{
  "status": "ok",
  "timestamp": "2024-01-15T10:30:00.000Z",
  "uptime": 5.123
}
```

#### Start the Frontend (in a new terminal)

```bash
cd frontend
npm run dev
```

**Expected output:**
```
▲ Next.js 14.0.0
- Local:        http://localhost:3000
- Network:      http://192.168.1.x:3000

✓ Ready in 2.5s
```

#### View in Browser

Open **http://localhost:3000** in your browser.

**You should see:**
- A dark background with "CollabCanvas" title
- A green checkmark saying "✓ Frontend setup complete!"

## 🎉 Success!

If you see the welcome page, **PR #1 is complete!** You have:

✅ Frontend running on port 3000  
✅ Backend running on port 4000  
✅ Both projects configured with TypeScript  
✅ Folder structure ready for development  

## ❓ Troubleshooting

### Port Already in Use

**Error:** `Port 3000 is already in use`

**Solution:**
```bash
# Find process using port 3000
lsof -i :3000

# Kill the process
kill -9 <PID>
```

Or change the port:
```bash
PORT=3001 npm run dev
```

### Module Not Found

**Error:** `Cannot find module 'express'`

**Solution:** Make sure you ran `npm install` in the correct directory:
```bash
cd backend  # or frontend
npm install
```

### TypeScript Errors

**Error:** Red squiggly lines in VS Code

**Solution:** These are normal for now. We'll add implementations in future PRs.

### Can't Access Backend from Frontend

**Issue:** Frontend can't connect to `http://localhost:4000`

**Solution:**
1. Make sure backend is running in another terminal
2. Check `.env.local` has correct `NEXT_PUBLIC_API_URL`
3. Check CORS settings in `backend/src/server.ts`

## 🔄 Development Workflow

### Starting Development

You need **two terminal windows** running:

**Terminal 1 - Backend:**
```bash
cd backend
npm run dev
```

**Terminal 2 - Frontend:**
```bash
cd frontend
npm run dev
```

### Making Changes

1. Edit files in your code editor
2. Save the file
3. Both servers auto-reload (hot reload)
4. Refresh browser to see changes

### Stopping Servers

Press `Ctrl + C` in each terminal to stop the servers.

## ⏭️ What's Next?

Now that PR #1 is complete, the next steps are:

1. **PR #2:** Set up database schema with Prisma
2. **PR #3:** Configure Jest testing infrastructure
3. **PR #4-5:** Build the canvas with TDD approach

See [TASK_LIST.md](./TASK_LIST.md) for the complete roadmap.

## 📚 Learn More

- [How Next.js Works](https://nextjs.org/learn)
- [Express.js Guide](https://expressjs.com/en/starter/hello-world.html)
- [TypeScript Handbook](https://www.typescriptlang.org/docs/)
- [TailwindCSS Docs](https://tailwindcss.com/docs)

## 🆘 Still Stuck?

1. Check that Node.js version is 18+
2. Delete `node_modules/` and run `npm install` again
3. Make sure you're in the correct directory
4. Check the README files for more details

---

**Remember:** This is just the foundation. The real features (canvas, collaboration, AI) come in later PRs!

