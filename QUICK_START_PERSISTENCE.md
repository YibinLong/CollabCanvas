# 🚀 Quick Start: Testing Persistence

## ✅ What Was Fixed

**Problem:** Frontend used `test-document-123` but it didn't exist in database
**Solution:** Created the document in your Supabase database
**Result:** Shapes now persist forever! 🎨

## 🧪 Test It Right Now

### 1. **Open Your App**
```bash
# If not running, start backend:
cd backend
npm run dev

# In another terminal, start frontend:
cd frontend
npm run dev
```

### 2. **Draw Some Shapes**
- Open http://localhost:3000
- Log in (or sign up)
- Draw rectangles, circles, lines
- Move them around

### 3. **Watch Backend Logs**
You should see:
```
[WS] 📖 Loading document test-document-123 from database...
[WS] ✅ Document test-document-123 loaded successfully  
[WS] ⏰ Auto-save started for test-document-123
[Persistence] Saved document test-document-123 (234 bytes)  ← Every 10 seconds
```

### 4. **Close ALL Browser Tabs**
This simulates everyone leaving.

Backend should show:
```
[WS] 👋 <your-email> left test-document-123
[WS] 📭 Room test-document-123 is now empty
[WS] 💾 Saving room test-document-123 to database...
[WS] ✅ Room test-document-123 saved successfully
```

### 5. **Open App Again**
- Go back to http://localhost:3000
- Log in
- **Your shapes should still be there!** ✨

## 📊 Check Supabase Database

### Via Supabase Dashboard:
1. Go to your Supabase project
2. Click "Table Editor" → `documents` table
3. Find the row with `id = test-document-123`
4. Check the `yjs_state` column:
   - **Before drawing**: NULL
   - **After drawing**: `<Binary>` with size (e.g., 234 bytes)
   - **Updates**: `updated_at` changes every 10 seconds while you draw

### What You'll See:
```
documents table:
┌─────────────────────┬─────────────────────────┬────────────┬─────────────┐
│ id                  │ title                   │ yjs_state  │ updated_at  │
├─────────────────────┼─────────────────────────┼────────────┼─────────────┤
│ test-document-123   │ Shared Canvas (All Us.) │ <Binary>   │ 2025-10-... │ ← THIS!
└─────────────────────┴─────────────────────────┴────────────┴─────────────┘
```

## 🛠️ Useful Commands

```bash
cd backend

# Check canvas state in database
npm run canvas:check

# Recreate shared canvas (if needed)
npm run canvas:create

# Open Prisma Studio (visual database editor)
npm run prisma:studio
```

## 🌐 Deployed App

Your **deployed app also uses the same database!**

Test it:
1. Open your deployed URL: https://your-app.onrender.com
2. Draw shapes
3. Close browser
4. Open localhost
5. **Same shapes appear!**

Both environments share `test-document-123` in Supabase.

## 💡 How It Works

```
┌─────────────────────────────────────────────────────────┐
│  USER DRAWS SHAPES                                      │
└──────────────────┬──────────────────────────────────────┘
                   │
                   ▼
┌─────────────────────────────────────────────────────────┐
│  YJS SYNCS IN REAL-TIME (WebSocket)                     │
│  • All connected users see changes instantly            │
└──────────────────┬──────────────────────────────────────┘
                   │
                   ▼
┌─────────────────────────────────────────────────────────┐
│  AUTO-SAVE RUNS (Every 10 seconds)                      │
│  • Serializes Yjs document to binary                    │
│  • Updates yjs_state column in PostgreSQL               │
└──────────────────┬──────────────────────────────────────┘
                   │
                   ▼
┌─────────────────────────────────────────────────────────┐
│  LAST USER LEAVES → FINAL SAVE                          │
│  • Ensures latest state is in database                  │
│  • Stops auto-save timer                                │
└──────────────────┬──────────────────────────────────────┘
                   │
         [Time passes: hours, days, weeks...]
                   │
                   ▼
┌─────────────────────────────────────────────────────────┐
│  NEW USER JOINS                                         │
│  • Loads yjs_state from PostgreSQL                      │
│  • Deserializes to Yjs document                         │
│  • All shapes restored! ✨                              │
└─────────────────────────────────────────────────────────┘
```

## 🎯 Current Setup

- **Single shared canvas**: `test-document-123`
- **All users**: Connect to the same document
- **Real-time collaboration**: See each other's changes live
- **Persistent storage**: Shapes saved to Supabase PostgreSQL
- **Auto-save**: Every 10 seconds
- **Final save**: When last user disconnects

## ✅ Verification Checklist

- [ ] Document `test-document-123` exists in database ✅
- [ ] Backend logs show "Persistence ENABLED" ✅
- [ ] Drawing shapes triggers auto-save (check logs) 
- [ ] `yjs_state` column populates in Supabase 
- [ ] Disconnecting all users triggers final save 
- [ ] Reconnecting restores all shapes 

## 🎉 You're Done!

Your canvas now has **full persistence**. Test it and enjoy! 🚀

**Need help?** Check:
- `PERSISTENCE_IMPLEMENTATION.md` - Technical details
- `PERSISTENCE_FIX_COMPLETE.md` - Fix summary
- Backend logs - See what's happening in real-time

