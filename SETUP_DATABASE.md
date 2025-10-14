# Database Setup for Local Testing

## Option A: Supabase (Recommended - 5 minutes)

### 1. Create Supabase Project
1. Go to https://supabase.com
2. Sign up or log in
3. Click "New Project"
4. Fill in:
   - Name: `collabcanvas-test`
   - Database Password: (generate strong password - SAVE IT!)
   - Region: Choose closest to you
5. Click "Create new project"
6. Wait 2 minutes for setup to complete

### 2. Get Database Connection Strings
1. In your Supabase project dashboard, click "Settings" (gear icon)
2. Click "Database" in left sidebar
3. Scroll to "Connection string" section
4. Copy these TWO strings:

**Connection pooling (for migrations):**
```
postgresql://postgres.[PROJECT-REF]:[YOUR-PASSWORD]@aws-0-us-west-1.pooler.supabase.com:5432/postgres
```

**Direct connection (for Prisma):**
```
postgresql://postgres.[PROJECT-REF]:[YOUR-PASSWORD]@db.[PROJECT-REF].supabase.co:5432/postgres
```

### 3. Create .env File
In the `backend/` folder, create a `.env` file with:

```env
# Backend Environment Variables

# Server port
PORT=4000

# Node environment
NODE_ENV=development

# Frontend URL (for CORS)
FRONTEND_URL=http://localhost:3000

# Supabase Database Connection
# Use "Direct connection" string here
DATABASE_URL="postgresql://postgres.[PROJECT-REF]:[YOUR-PASSWORD]@db.[PROJECT-REF].supabase.co:5432/postgres"

# Use "Connection pooling" string here
DIRECT_URL="postgresql://postgres.[PROJECT-REF]:[YOUR-PASSWORD]@aws-0-us-west-1.pooler.supabase.com:5432/postgres"
```

**IMPORTANT:** Replace `[PROJECT-REF]` and `[YOUR-PASSWORD]` with your actual values!

---

## Option B: Local PostgreSQL (Advanced - 15 minutes)

### 1. Install PostgreSQL
**macOS (Homebrew):**
```bash
brew install postgresql@15
brew services start postgresql@15
```

**Windows:**
Download from https://www.postgresql.org/download/windows/

**Linux:**
```bash
sudo apt-get update
sudo apt-get install postgresql postgresql-contrib
sudo systemctl start postgresql
```

### 2. Create Database
```bash
# Login to PostgreSQL
psql postgres

# Create database
CREATE DATABASE collabcanvas_dev;

# Create user (optional)
CREATE USER collabcanvas_user WITH PASSWORD 'your_secure_password';
GRANT ALL PRIVILEGES ON DATABASE collabcanvas_dev TO collabcanvas_user;

# Exit
\q
```

### 3. Create .env File
In the `backend/` folder, create a `.env` file:

```env
# Backend Environment Variables

# Server port
PORT=4000

# Node environment
NODE_ENV=development

# Frontend URL (for CORS)
FRONTEND_URL=http://localhost:3000

# Local PostgreSQL Connection
DATABASE_URL="postgresql://collabcanvas_user:your_secure_password@localhost:5432/collabcanvas_dev"
DIRECT_URL="postgresql://collabcanvas_user:your_secure_password@localhost:5432/collabcanvas_dev"
```

---

## Next Steps

After setting up the database, continue with the main setup guide.

