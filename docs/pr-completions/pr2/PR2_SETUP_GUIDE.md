# PR#2: Database Schema & Prisma Setup - Complete Guide

This guide will walk you through setting up Supabase, configuring environment variables, and testing your database connection.

---

## 📝 **TABLE OF CONTENTS**

1. [Supabase Setup](#1-supabase-setup)
2. [Create Environment Variables](#2-create-environment-variables)
3. [Run Prisma Commands](#3-run-prisma-commands)
4. [Test Everything Works](#4-test-everything-works)
5. [Understanding What We Built](#5-understanding-what-we-built)
6. [Troubleshooting](#6-troubleshooting)

---

## 1. **SUPABASE SETUP** 🗄️

### Step 1.1: Create a Supabase Project

1. Go to https://supabase.com
2. Sign up or log in with GitHub
3. Click the green **"New Project"** button
4. Fill in the form:
   - **Name**: `collabcanvas` (or any name you prefer)
   - **Database Password**: Create a **strong password** (example: `MyS3cur3P@ssw0rd!`)
   - **Region**: Choose the closest region to you (e.g., `US West`)
   - **Pricing Plan**: Select **"Free"** (it's perfect for development)
5. Click **"Create new project"**
6. ⏳ Wait 2-3 minutes while Supabase sets up your database

### Step 1.2: Get Your Database Connection String

1. Once your project is ready, click **"Settings"** (⚙️ gear icon) in the left sidebar
2. Click **"Database"** under Settings
3. Scroll down to the **"Connection string"** section
4. Click the **"URI"** tab
5. You'll see something like:
   ```
   postgresql://postgres:[YOUR-PASSWORD]@db.abcdefghijk.supabase.co:5432/postgres
   ```
6. **Copy this entire string**
7. **IMPORTANT**: Replace `[YOUR-PASSWORD]` with the actual password you created in Step 1.1

   Example:
   ```
   postgresql://postgres:MyS3cur3P@ssw0rd!@db.abcdefghijk.supabase.co:5432/postgres
   ```

### Step 1.3: Get Your Supabase API Keys

1. Still in Settings, click **"API"** in the menu
2. You'll see several values. Copy these three:
   
   **a) Project URL**
   ```
   https://abcdefghijk.supabase.co
   ```
   
   **b) anon/public key** (looks like a long random string starting with `eyJ...`)
   ```
   eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSI...
   ```
   
   **c) service_role key** (scroll down, click "Reveal" to see it)
   ```
   eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSI...
   ```

3. **Keep these safe** - you'll need them in the next step!

---

## 2. **CREATE ENVIRONMENT VARIABLES** 🔐

### Step 2.1: Create Backend `.env` File

1. Navigate to the `backend` folder in your project
2. Create a new file called `.env` (exactly that name, no extension)
3. Copy and paste this template:

```env
# Database Connection
DATABASE_URL="postgresql://postgres:[YOUR-PASSWORD]@db.xxxxx.supabase.co:5432/postgres"

# Supabase Configuration
SUPABASE_URL="https://xxxxx.supabase.co"
SUPABASE_ANON_KEY="your-anon-public-key-here"
SUPABASE_SERVICE_KEY="your-service-role-key-here"

# Server Configuration
PORT=4000
NODE_ENV=development

# JWT Secret (temporary for now, we'll change this later)
JWT_SECRET="temporary-secret-replace-in-production"

# OpenAI API Key (leave empty for now, we'll add this in a later PR)
OPENAI_API_KEY=""
```

4. **Replace the placeholder values** with your actual Supabase values:
   - `DATABASE_URL`: Paste the connection string from Step 1.2
   - `SUPABASE_URL`: Paste your Project URL from Step 1.3a
   - `SUPABASE_ANON_KEY`: Paste your anon/public key from Step 1.3b
   - `SUPABASE_SERVICE_KEY`: Paste your service_role key from Step 1.3c

5. **Save the file**

### Step 2.2: Create Frontend `.env.local` File

1. Navigate to the `frontend` folder in your project
2. Create a new file called `.env.local` (exactly that name)
3. Copy and paste this template:

```env
# Backend API URLs (for local development)
NEXT_PUBLIC_API_URL=http://localhost:4000
NEXT_PUBLIC_WS_URL=ws://localhost:4000

# Supabase Configuration (use the same keys as backend)
NEXT_PUBLIC_SUPABASE_URL="https://xxxxx.supabase.co"
NEXT_PUBLIC_SUPABASE_ANON_KEY="your-anon-public-key-here"
```

4. **Replace the placeholder values** with your Supabase values:
   - `NEXT_PUBLIC_SUPABASE_URL`: Same as backend
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`: Same as backend (only the anon key, NOT the service key)

5. **Save the file**

### ✅ Verification

- You should now have:
  - `/backend/.env` file with your Supabase credentials
  - `/frontend/.env.local` file with your Supabase credentials
- These files are automatically ignored by Git (they won't be committed)

---

## 3. **RUN PRISMA COMMANDS** ⚙️

Now we'll set up the database schema and create the tables.

### Step 3.1: Open Terminal in Backend Folder

```bash
cd backend
```

### Step 3.2: Generate Prisma Client

This creates TypeScript types based on your schema.

```bash
npm run prisma:generate
```

**What this does**: Reads `prisma/schema.prisma` and generates TypeScript types so you can query your database with type safety.

**Expected output**:
```
✔ Generated Prisma Client
```

### Step 3.3: Create Database Migration

This creates the actual tables in your Supabase database.

```bash
npm run prisma:migrate
```

**What this does**: 
- Connects to your Supabase PostgreSQL database
- Creates the `users`, `documents`, and `document_versions` tables
- Saves this migration so you can track database changes over time

**You'll be prompted**: "Enter a name for the new migration:"
- Type: `initial_schema` and press Enter

**Expected output**:
```
Your database is now in sync with your schema.
✔ Generated Prisma Client
```

### Step 3.4: Seed the Database with Test Data

This populates your database with sample users and documents for testing.

```bash
npm run prisma:seed
```

**What this does**: Runs the `prisma/seed.ts` file which creates:
- 2 test users (Alice and Bob)
- 3 test documents

**Expected output**:
```
🌱 Starting database seed...
Creating test users...
✅ Created users: Alice Designer, Bob Developer
Creating test documents...
✅ Created 3 documents
   - My First Canvas (owned by Alice Designer)
   - Design Mockup (owned by Bob Developer)
   - Untitled (owned by Alice Designer)

✨ Seed completed successfully!
```

---

## 4. **TEST EVERYTHING WORKS** ✅

### Step 4.1: Test Database Connection

Run our custom test script:

```bash
npm run test:db
```

**What this does**: 
- Connects to your Supabase database
- Runs test queries
- Shows you how many users and documents are in the database

**Expected output**:
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

### Step 4.2: Open Prisma Studio (Optional but Recommended!)

Prisma Studio is a visual database browser - it's amazing!

```bash
npm run prisma:studio
```

**What this does**: Opens a web interface at `http://localhost:5555` where you can:
- Browse your database tables
- See all your data (the test users and documents)
- Edit data manually if needed
- It's like a simplified database admin panel!

**Try it**:
1. Click on "User" in the left sidebar
2. You should see Alice and Bob
3. Click on "Document" to see the 3 test documents

Press `Ctrl+C` in the terminal to stop Prisma Studio when you're done.

---

## 5. **UNDERSTANDING WHAT WE BUILT** 📚

### The Database Schema

We created 3 tables:

#### **1. Users Table** (`users`)
```
- id: Unique identifier for each user
- email: User's email address
- name: User's display name
- avatarUrl: Profile picture URL
- createdAt: When the user was created
- updatedAt: Last time user info was updated
```

**WHY**: Stores user information. Even though Supabase handles authentication, we store additional profile data here.

#### **2. Documents Table** (`documents`)
```
- id: Unique identifier for each document
- title: Document name (e.g., "My Design")
- ownerId: Which user owns this document (links to Users table)
- yjsState: The actual canvas data (stored as binary)
- createdAt: When the document was created
- updatedAt: Last time the document was modified
```

**WHY**: Stores all your canvas documents. The `yjsState` field will contain the entire canvas state (shapes, positions, colors, etc.) serialized by Yjs.

#### **3. DocumentVersions Table** (`document_versions`)
```
- id: Unique identifier for this version
- documentId: Which document this version belongs to
- yjsState: Snapshot of the canvas at this point in time
- label: Optional description (e.g., "Before AI changes")
- createdAt: When this snapshot was taken
```

**WHY**: Stores historical snapshots so users can restore previous versions. Like "undo history" that persists even if you close the app.

### The Files We Created

1. **`prisma/schema.prisma`**: Defines your database structure
2. **`prisma/seed.ts`**: Script to populate test data
3. **`src/utils/prisma.ts`**: Prisma client singleton (for querying the database)
4. **`src/utils/test-db-connection.ts`**: Test script to verify everything works
5. **`.env.example`**: Template for environment variables (safe to commit to Git)

---

## 6. **TROUBLESHOOTING** 🔧

### Problem: "Environment variable not found: DATABASE_URL"

**Solution**: 
- Make sure you created the `.env` file in the `backend` folder (not the root folder)
- The file must be named exactly `.env` (no `.txt` extension)
- Check that `DATABASE_URL` is spelled correctly

### Problem: "Can't reach database server"

**Solution**:
- Verify your Supabase project is active (go to supabase.com dashboard)
- Check your DATABASE_URL is correct
- Make sure the password in the URL matches your Supabase password
- Try copy-pasting the connection string again from Supabase

### Problem: Migration fails with "relation already exists"

**Solution**:
```bash
npm run db:reset
```
This will reset your database and rerun all migrations. **Warning**: This deletes all data!

### Problem: Prisma Studio shows empty tables

**Solution**:
- Run the seed script again:
```bash
npm run prisma:seed
```

### Problem: "prisma command not found"

**Solution**:
```bash
npm install
```
This reinstalls all dependencies including Prisma.

---

## 🎉 **SUCCESS! WHAT'S NEXT?**

If all tests passed, you've successfully completed PR#2! You now have:

✅ A Supabase project with PostgreSQL database  
✅ Database schema defined with Prisma  
✅ 3 tables created (users, documents, document_versions)  
✅ Test data in your database  
✅ Working connection between your app and database  

**Next Steps**:
- PR#3 will set up testing infrastructure (Jest)
- PR#4-5 will build the canvas UI
- Later PRs will use this database to save and load your canvas documents

---

## 📌 **QUICK COMMAND REFERENCE**

```bash
# Generate Prisma Client (after changing schema.prisma)
npm run prisma:generate

# Create and apply a new migration
npm run prisma:migrate

# Seed the database with test data
npm run prisma:seed

# Test database connection
npm run test:db

# Open Prisma Studio (visual database browser)
npm run prisma:studio

# Push schema changes without creating migration (for development)
npm run db:push

# Reset database and rerun all migrations (⚠️ deletes all data)
npm run db:reset
```

---

**Questions?** Check the troubleshooting section or review the PRD.md and TASK_LIST.md files.

