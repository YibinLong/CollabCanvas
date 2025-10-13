# 🎯 WHAT YOU NEED TO DO NOW - PR#2

I've set up all the code for PR#2. Now you need to do 3 things:

---

## 1️⃣ **SETUP SUPABASE** (5 min)

### Go to: https://supabase.com

1. Sign up/login
2. Click "New Project"
3. Name it "collabcanvas"
4. Set a password (SAVE IT!)
5. Choose region → Create

### Get These 4 Things:

**A) Database URL:**
- Go to: Settings > Database > Connection String
- Click "URI" tab
- Copy the whole thing
- Replace `[YOUR-PASSWORD]` with your actual password

**B) Project URL:**
- Go to: Settings > API
- Copy "Project URL" (looks like `https://xxxxx.supabase.co`)

**C) Anon Key:**
- Same page, copy "anon public" key (long string starting with `eyJ`)

**D) Service Key:**
- Same page, click "Reveal" and copy "service_role" key

---

## 2️⃣ **CREATE .ENV FILES** (2 min)

### File 1: `/backend/.env`

Create this file and paste this (replace the xxxxx with your values):

```env
DATABASE_URL="postgresql://postgres:YOUR_PASSWORD@db.xxxxx.supabase.co:5432/postgres"
SUPABASE_URL="https://xxxxx.supabase.co"
SUPABASE_ANON_KEY="eyJhbGciOiJI..."
SUPABASE_SERVICE_KEY="eyJhbGciOiJI..."
PORT=4000
NODE_ENV=development
JWT_SECRET="temporary-secret-replace-in-production"
OPENAI_API_KEY=""
```

### File 2: `/frontend/.env.local`

Create this file and paste this (replace with your values):

```env
NEXT_PUBLIC_API_URL=http://localhost:4000
NEXT_PUBLIC_WS_URL=ws://localhost:4000
NEXT_PUBLIC_SUPABASE_URL="https://xxxxx.supabase.co"
NEXT_PUBLIC_SUPABASE_ANON_KEY="eyJhbGciOiJI..."
```

---

## 3️⃣ **RUN THESE COMMANDS** (3 min)

Open terminal, go to backend folder:

```bash
cd backend
```

Then run these **in order**:

```bash
# Step 1: Generate Prisma types
npm run prisma:generate

# Step 2: Create database tables
npm run prisma:migrate
# When it asks for a name, type: initial_schema

# Step 3: Add test data (2 users, 3 documents)
npm run prisma:seed

# Step 4: Test everything works
npm run test:db
```

---

## ✅ **SUCCESS LOOKS LIKE:**

You should see:

```
🔍 Testing database connection...

Test 1: Connecting to database...
✅ Connected successfully!

Test 2: Running test query...
✅ Query successful!
   - Users in database: 2
   - Documents in database: 3

Test 3: Database info...
✅ Database version: PostgreSQL

🎉 All tests passed! Database connection is working.
```

---

## 🎉 **THEN YOU'RE DONE!**

If you see that success message, PR#2 is complete!

### Want to see your database?

Run this to open a visual browser:

```bash
npm run prisma:studio
```

Opens at http://localhost:5555 - you can see Alice, Bob, and the 3 test documents!

---

## ❌ **IF SOMETHING FAILS:**

**Error: "Can't find .env file"**
- Make sure it's in `/backend/.env` (not root folder)
- File must be exactly `.env` (no `.txt`)

**Error: "Can't connect to database"**
- Check your password in DATABASE_URL is correct
- Go back to Supabase and copy the connection string again

**Error: "Migration failed"**
- Run: `npm run db:reset` to start fresh

---

## 📚 **GUIDES AVAILABLE:**

- **PR2_QUICK_START.md** - Quick reference
- **PR2_SETUP_GUIDE.md** - Detailed step-by-step with explanations
- **PR2_IMPLEMENTATION_SUMMARY.md** - What I built and why

---

**Ready? Let's do it! Run those commands and let me know when you see the success message! 🚀**

