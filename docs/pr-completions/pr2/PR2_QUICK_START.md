# PR#2 Quick Start - What YOU Need to Do

## 🎯 **YOUR TASKS** (Manual Setup Required)

### **STEP 1: SUPABASE SETUP** (5 minutes)

1. **Go to**: https://supabase.com
2. **Create project** named "collabcanvas"
3. **Set database password** (save it!)
4. **Get 3 things** from your project:
   - Settings > Database > Connection String (URI tab)
   - Settings > API > Project URL
   - Settings > API > anon key
   - Settings > API > service_role key (click "Reveal")

---

### **STEP 2: CREATE `.env` FILES** (2 minutes)

#### A) Create `/backend/.env` file:

```env
DATABASE_URL="postgresql://postgres:YOUR_PASSWORD@db.xxxxx.supabase.co:5432/postgres"
SUPABASE_URL="https://xxxxx.supabase.co"
SUPABASE_ANON_KEY="eyJ..."
SUPABASE_SERVICE_KEY="eyJ..."
PORT=4000
NODE_ENV=development
JWT_SECRET="temporary-secret-replace-in-production"
OPENAI_API_KEY=""
```

**⚠️ Replace** the placeholders with your actual Supabase values!

#### B) Create `/frontend/.env.local` file:

```env
NEXT_PUBLIC_API_URL=http://localhost:4000
NEXT_PUBLIC_WS_URL=ws://localhost:4000
NEXT_PUBLIC_SUPABASE_URL="https://xxxxx.supabase.co"
NEXT_PUBLIC_SUPABASE_ANON_KEY="eyJ..."
```

**⚠️ Replace** with your Supabase Project URL and anon key!

---

### **STEP 3: RUN COMMANDS** (3 minutes)

Open terminal in the `backend` folder and run these commands **in order**:

```bash
# 1. Generate Prisma Client
npm run prisma:generate

# 2. Create database tables
npm run prisma:migrate
# When prompted, enter migration name: initial_schema

# 3. Add test data
npm run prisma:seed

# 4. Test connection
npm run test:db

# 5. (Optional) View database in browser
npm run prisma:studio
```

---

## ✅ **SUCCESS CRITERIA**

You should see:
- ✅ "All tests passed! Database connection is working."
- ✅ 2 users in database (Alice and Bob)
- ✅ 3 documents in database

---

## 📖 **DETAILED GUIDE**

For step-by-step instructions with screenshots and troubleshooting, see:
**`PR2_SETUP_GUIDE.md`**

---

## 🆘 **COMMON ISSUES**

**Problem**: "Environment variable not found: DATABASE_URL"  
**Fix**: Create `.env` file in `/backend` folder (not root!)

**Problem**: "Can't reach database server"  
**Fix**: Check DATABASE_URL password is correct

**Problem**: Migration fails  
**Fix**: Run `npm run db:reset` to start fresh

---

## 🎉 **DONE?**

Once `npm run test:db` passes, PR#2 is complete!

Next: PR#3 - Testing Infrastructure Setup

