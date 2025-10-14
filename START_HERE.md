# 🚀 START HERE - Quick Local Testing

**Time:** 10 minutes to get everything running

---

## ⚡ **Quick Start (Copy & Paste These Commands)**

### **Step 1: Set Up Database** ⏱️ 5 minutes

You need a PostgreSQL database. **Easiest option is Supabase:**

1. **Go to:** https://supabase.com
2. **Click:** "New Project"
3. **Fill in:**
   - Name: `collabcanvas-test`
   - Password: **Generate & SAVE IT!**
   - Region: Choose closest
4. **Click:** "Create new project"
5. **Wait:** 2 minutes ⏳

6. **Get connection strings:**
   - In Supabase dashboard: Settings → Database → Connection string
   - Copy TWO strings:
     - ✅ "Direct connection" 
     - ✅ "Connection pooling"

7. **Update `.env` file:**

Open `backend/.env` and replace it with:

```env
# Backend Environment Variables

# Server port
PORT=4000

# Node environment
NODE_ENV=development

# Frontend URL (for CORS)
FRONTEND_URL=http://localhost:3000

# Supabase Database Connection
# Replace [YOUR-PROJECT-REF] and [YOUR-PASSWORD] with your actual values!
DATABASE_URL="postgresql://postgres.[YOUR-PROJECT-REF]:[YOUR-PASSWORD]@db.[YOUR-PROJECT-REF].supabase.co:5432/postgres"
DIRECT_URL="postgresql://postgres.[YOUR-PROJECT-REF]:[YOUR-PASSWORD]@aws-0-us-west-1.pooler.supabase.com:5432/postgres"
```

**⚠️ CRITICAL:** Replace the placeholders with your actual Supabase values!

---

### **Step 2: Install & Setup** ⏱️ 2 minutes

Copy and paste these commands **one at a time**:

```bash
# Navigate to backend
cd /Users/yibin/Documents/WORKZONE/VSCODE/GAUNTLET_AI/1_Week/Figma_Clone/backend

# Install dependencies (if not already done)
npm install

# Push database schema to Supabase
npx prisma db push

# Generate Prisma client
npx prisma generate
```

**Expected output:** "✔ The database is now in sync with your schema."

---

### **Step 3: Run Tests** ⏱️ 10 seconds

```bash
npm test
```

**Expected output:**
```
Test Suites: 5 passed, 5 total
Tests:       58 passed, 58 total
✨ Done in 4s
```

---

### **Step 4: Start Backend Server** ⏱️ 1 second

```bash
npm run dev
```

**Expected output:**
```
🚀 Server running on http://localhost:4000
🔌 WebSocket server running on ws://localhost:4000
📊 Health check: http://localhost:4000/health
✓ Backend setup complete!
```

**✅ Keep this terminal window open!**

---

### **Step 5: Test API** ⏱️ 1 minute

Open a **NEW terminal window** and run:

```bash
# Test 1: Health check
curl http://localhost:4000/health

# Test 2: Create a document
curl -X POST http://localhost:4000/api/documents \
  -H "Content-Type: application/json" \
  -H "x-user-id: test-user-123" \
  -d '{"title": "My First Canvas"}'

# Test 3: List documents
curl http://localhost:4000/api/documents \
  -H "x-user-id: test-user-123"
```

**If you see JSON responses → IT WORKS! 🎉**

---

## ✅ **Success! What's Now Running?**

1. **Backend Server:** http://localhost:4000
   - Document API endpoints
   - WebSocket server
   - Yjs persistence

2. **Database:** Supabase (cloud)
   - Stores documents
   - View at: https://supabase.com/dashboard

---

## 🎯 **What Can You Test?**

### **Test Document API:**
See all commands in: `LOCAL_TESTING_GUIDE.md`

### **View Data in Supabase:**
1. Go to Supabase dashboard
2. Click "Table Editor"
3. Select "documents" table
4. See your test documents!

### **Test Yjs Persistence:**
See: `LOCAL_TESTING_GUIDE.md` Step 8

---

## 🐛 **Quick Troubleshooting**

### **"Cannot connect to database"**
- Check `.env` file has correct Supabase connection strings
- Verify you replaced `[YOUR-PROJECT-REF]` and `[YOUR-PASSWORD]`
- Make sure Supabase project status is green

### **"Port 4000 already in use"**
```bash
lsof -ti:4000 | xargs kill -9
```

### **Tests fail**
```bash
# Regenerate Prisma client
npx prisma generate

# Push schema again
npx prisma db push
```

### **Need more help?**
See complete guide: `LOCAL_TESTING_GUIDE.md`

---

## 📚 **What's Next?**

- ✅ **Phase 4 Complete** - Backend & Persistence working!
- 🔜 **Phase 5** - Add Supabase Authentication (JWT)
- 🔜 **Phase 6** - AI Integration (OpenAI)
- 🔜 **Phase 7** - Optimization & Security
- 🔜 **Phase 8** - Deployment

---

## 📖 **Documentation**

- 📘 [Complete Testing Guide](LOCAL_TESTING_GUIDE.md)
- 📗 [Phase 4 Completion Report](docs/pr-completions/phase4/PHASE4_COMPLETION.md)
- 📙 [API Usage Guide](docs/guides/PHASE4_API_USAGE.md)
- 📕 [Database Setup Guide](SETUP_DATABASE.md)

---

**🎉 That's it! You now have a working backend with document management and Yjs persistence!**

