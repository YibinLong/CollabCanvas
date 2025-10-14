# 🚀 Local Testing Guide - Phase 4

**Time Required:** 10-15 minutes  
**What You'll Test:** Backend API + Yjs Persistence

---

## ✅ **Step 1: Database Setup (5 minutes)**

### Option A: Supabase (Recommended)

1. **Go to Supabase:**
   - Visit https://supabase.com
   - Sign up or log in
   - Click "New Project"

2. **Create Project:**
   - Name: `collabcanvas-test`
   - Database Password: **Generate & SAVE IT!**
   - Region: Choose closest to you
   - Click "Create new project"
   - ⏳ Wait 2 minutes for setup

3. **Get Connection Strings:**
   - Settings → Database → Connection string
   - Copy **TWO** strings:
     - "Direct connection" (for DATABASE_URL)
     - "Connection pooling" (for DIRECT_URL)

4. **Create `.env` file in `backend/` folder:**

```bash
cd /Users/yibin/Documents/WORKZONE/VSCODE/GAUNTLET_AI/1_Week/Figma_Clone/backend
```

Create `backend/.env`:
```env
PORT=4000
NODE_ENV=development
FRONTEND_URL=http://localhost:3000

# Replace with YOUR connection strings from Supabase!
DATABASE_URL="postgresql://postgres.[YOUR-PROJECT-REF]:[YOUR-PASSWORD]@db.[YOUR-PROJECT-REF].supabase.co:5432/postgres"
DIRECT_URL="postgresql://postgres.[YOUR-PROJECT-REF]:[YOUR-PASSWORD]@aws-0-us-west-1.pooler.supabase.com:5432/postgres"
```

**⚠️ CRITICAL:** Replace `[YOUR-PROJECT-REF]` and `[YOUR-PASSWORD]` with your actual values!

---

## ✅ **Step 2: Install Backend Dependencies**

```bash
cd /Users/yibin/Documents/WORKZONE/VSCODE/GAUNTLET_AI/1_Week/Figma_Clone/backend
npm install
```

**Expected:** Should install ~500 packages in 1-2 minutes.

---

## ✅ **Step 3: Initialize Database Schema**

This creates the tables in your database:

```bash
cd /Users/yibin/Documents/WORKZONE/VSCODE/GAUNTLET_AI/1_Week/Figma_Clone/backend
npx prisma db push
```

**Expected Output:**
```
✔ Generated Prisma Client
✔ The database is now in sync with your schema.
```

**What this does:**
- Creates `users` table
- Creates `documents` table (with yjsState column)
- Creates `document_versions` table

---

## ✅ **Step 4: Verify Database Connection**

```bash
cd /Users/yibin/Documents/WORKZONE/VSCODE/GAUNTLET_AI/1_Week/Figma_Clone/backend
npm run test:db
```

**Expected Output:**
```
✅ Database connection successful!
```

**If you see an error:**
- Check your `.env` file has correct connection strings
- Verify Supabase project is running (green status in dashboard)
- Make sure you replaced `[YOUR-PROJECT-REF]` and `[YOUR-PASSWORD]`

---

## ✅ **Step 5: Run Backend Tests**

Test the Phase 4 features:

```bash
cd /Users/yibin/Documents/WORKZONE/VSCODE/GAUNTLET_AI/1_Week/Figma_Clone/backend
npm test
```

**Expected Output:**
```
Test Suites: 5 passed, 5 total
Tests:       58 passed, 58 total
Time:        ~4 seconds
```

**Tests Include:**
- ✅ Document API (13 tests)
- ✅ Yjs Persistence (13 tests)
- ✅ WebSocket Server (10 tests)
- ✅ Test Utilities (22 tests)

---

## ✅ **Step 6: Start Backend Server**

Open a **NEW terminal window** and run:

```bash
cd /Users/yibin/Documents/WORKZONE/VSCODE/GAUNTLET_AI/1_Week/Figma_Clone/backend
npm run dev
```

**Expected Output:**
```
🚀 Server running on http://localhost:4000
🔌 WebSocket server running on ws://localhost:4000
📊 Health check: http://localhost:4000/health
✓ Backend setup complete!
```

**Keep this terminal open!** The server needs to stay running.

---

## ✅ **Step 7: Test the API Endpoints**

Open a **SECOND terminal window** and test each endpoint:

### 7.1 Test Health Check

```bash
curl http://localhost:4000/health
```

**Expected Response:**
```json
{
  "status": "ok",
  "timestamp": "2025-10-14T...",
  "uptime": 1.234,
  "websocket": {
    "active": true,
    "connections": 0
  }
}
```

### 7.2 Test Create Document

```bash
curl -X POST http://localhost:4000/api/documents \
  -H "Content-Type: application/json" \
  -H "x-user-id: test-user-123" \
  -d '{"title": "My Test Canvas"}'
```

**Expected Response:**
```json
{
  "document": {
    "id": "some-uuid-here",
    "title": "My Test Canvas",
    "ownerId": "test-user-123",
    "yjsState": null,
    "createdAt": "2025-10-14T...",
    "updatedAt": "2025-10-14T..."
  }
}
```

**📝 SAVE THE DOCUMENT ID** - you'll need it for the next tests!

### 7.3 Test List Documents

```bash
curl http://localhost:4000/api/documents \
  -H "x-user-id: test-user-123"
```

**Expected Response:**
```json
{
  "documents": [
    {
      "id": "some-uuid-here",
      "title": "My Test Canvas",
      "ownerId": "test-user-123",
      "createdAt": "2025-10-14T...",
      "updatedAt": "2025-10-14T..."
    }
  ]
}
```

### 7.4 Test Get Document by ID

Replace `YOUR-DOC-ID` with the ID from step 7.2:

```bash
curl http://localhost:4000/api/documents/YOUR-DOC-ID \
  -H "x-user-id: test-user-123"
```

**Expected Response:**
```json
{
  "document": {
    "id": "YOUR-DOC-ID",
    "title": "My Test Canvas",
    "ownerId": "test-user-123",
    "yjsState": null,
    "createdAt": "...",
    "updatedAt": "..."
  }
}
```

### 7.5 Test Delete Document

Replace `YOUR-DOC-ID` with the ID from step 7.2:

```bash
curl -X DELETE http://localhost:4000/api/documents/YOUR-DOC-ID \
  -H "x-user-id: test-user-123"
```

**Expected Response:**
```json
{
  "message": "Document deleted successfully"
}
```

### 7.6 Test Error Handling (403 Forbidden)

Try to access another user's document:

```bash
curl -X POST http://localhost:4000/api/documents \
  -H "Content-Type: application/json" \
  -H "x-user-id: user-1" \
  -d '{"title": "User 1 Document"}'

# Save the doc ID, then try to access as user-2
curl http://localhost:4000/api/documents/YOUR-DOC-ID \
  -H "x-user-id: user-2"
```

**Expected Response:**
```json
{
  "error": "Access denied"
}
```

---

## ✅ **Step 8: Test Yjs Persistence (Node.js Script)**

Let's test the persistence layer directly. Create a test script:

```bash
cd /Users/yibin/Documents/WORKZONE/VSCODE/GAUNTLET_AI/1_Week/Figma_Clone/backend
```

Create `test-persistence.ts`:

```typescript
import * as Y from 'yjs';
import { saveYjsDocument, loadYjsDocument } from './src/services/yjsPersistence';

async function testPersistence() {
  console.log('🧪 Testing Yjs Persistence...\n');

  // 1. Create a document with shapes
  console.log('1️⃣  Creating Yjs document with shapes...');
  const ydoc = new Y.Doc();
  const shapesMap = ydoc.getMap('shapes');
  
  const rect = new Y.Map();
  rect.set('id', 'rect-1');
  rect.set('type', 'rect');
  rect.set('x', 100);
  rect.set('y', 100);
  rect.set('width', 200);
  rect.set('height', 150);
  rect.set('color', '#3b82f6');
  
  shapesMap.set('rect-1', rect);
  console.log('   ✅ Created rectangle shape');

  // 2. Save to database
  console.log('\n2️⃣  Saving to database...');
  await saveYjsDocument('test-doc-persistence', ydoc);
  console.log('   ✅ Document saved!');

  // 3. Load from database
  console.log('\n3️⃣  Loading from database...');
  const loadedDoc = await loadYjsDocument('test-doc-persistence');
  const loadedShapes = loadedDoc.getMap('shapes');
  console.log('   ✅ Document loaded!');

  // 4. Verify data integrity
  console.log('\n4️⃣  Verifying data...');
  const loadedRect = loadedShapes.get('rect-1') as Y.Map<any>;
  
  console.log('   Shape ID:', loadedRect.get('id'));
  console.log('   Shape Type:', loadedRect.get('type'));
  console.log('   Position:', `(${loadedRect.get('x')}, ${loadedRect.get('y')})`);
  console.log('   Size:', `${loadedRect.get('width')}x${loadedRect.get('height')}`);
  console.log('   Color:', loadedRect.get('color'));
  
  if (
    loadedRect.get('type') === 'rect' &&
    loadedRect.get('x') === 100 &&
    loadedRect.get('width') === 200
  ) {
    console.log('\n✅ PERSISTENCE TEST PASSED! Data matches perfectly.');
  } else {
    console.log('\n❌ PERSISTENCE TEST FAILED! Data mismatch.');
  }
}

testPersistence().catch(console.error);
```

Run it:

```bash
npx tsx test-persistence.ts
```

**Expected Output:**
```
🧪 Testing Yjs Persistence...

1️⃣  Creating Yjs document with shapes...
   ✅ Created rectangle shape

2️⃣  Saving to database...
[Persistence] Saved document test-doc-persistence (xxx bytes)
   ✅ Document saved!

3️⃣  Loading from database...
[Persistence] Loaded document test-doc-persistence (xxx bytes)
   ✅ Document loaded!

4️⃣  Verifying data...
   Shape ID: rect-1
   Shape Type: rect
   Position: (100, 100)
   Size: 200x150
   Color: #3b82f6

✅ PERSISTENCE TEST PASSED! Data matches perfectly.
```

---

## ✅ **Step 9: View Data in Supabase Dashboard**

1. Go to your Supabase project dashboard
2. Click "Table Editor" in left sidebar
3. Select "documents" table
4. You should see your test documents!

**You can:**
- View the `yjsState` column (binary data)
- See `createdAt` and `updatedAt` timestamps
- Check `ownerId` matches your test user

---

## ✅ **Step 10: Test Auto-Save Feature**

Create `test-autosave.ts`:

```typescript
import * as Y from 'yjs';
import { startAutoSave, stopAutoSave } from './src/services/yjsPersistence';

async function testAutoSave() {
  console.log('🧪 Testing Auto-Save...\n');

  const ydoc = new Y.Doc();
  const shapesMap = ydoc.getMap('shapes');

  console.log('1️⃣  Starting auto-save (every 3 seconds)...');
  const interval = startAutoSave('test-autosave-doc', ydoc, 3000);

  console.log('2️⃣  Adding shapes every second...');
  
  for (let i = 0; i < 10; i++) {
    const shape = new Y.Map();
    shape.set('id', `shape-${i}`);
    shape.set('type', 'rect');
    shape.set('x', i * 50);
    shapesMap.set(`shape-${i}`, shape);
    
    console.log(`   Added shape-${i}`);
    await new Promise(resolve => setTimeout(resolve, 1000));
  }

  console.log('\n3️⃣  Stopping auto-save...');
  stopAutoSave(interval);
  
  console.log('✅ Auto-save test complete! Check database for saves.');
}

testAutoSave().catch(console.error);
```

Run it:

```bash
npx tsx test-autosave.ts
```

**Expected Output:**
You'll see saves happening every 3 seconds while shapes are being added.

---

## 🎉 **Success Checklist**

✅ Database connected  
✅ All 58 tests passing  
✅ Backend server running on http://localhost:4000  
✅ Health check responds  
✅ Can create documents via API  
✅ Can list documents via API  
✅ Can get document by ID via API  
✅ Can delete documents via API  
✅ Authorization works (403 for wrong user)  
✅ Yjs persistence saves and loads correctly  
✅ Auto-save works  
✅ Data visible in Supabase dashboard  

---

## 🐛 **Troubleshooting**

### "Cannot connect to database"
- Check `.env` file exists in `backend/` folder
- Verify connection strings are correct
- Make sure Supabase project is running (green status)
- Try `npm run test:db` to test connection

### "Port 4000 already in use"
- Kill existing process: `lsof -ti:4000 | xargs kill -9`
- Or change PORT in `.env` to 4001

### "Module not found"
- Run `npm install` in backend folder
- Run `npx prisma generate` to regenerate Prisma client

### Tests fail with database errors
- Run `npx prisma db push` to sync schema
- Check `.env` has both DATABASE_URL and DIRECT_URL

### "Prisma Client not generated"
```bash
cd backend
npx prisma generate
```

---

## 📊 **What's Running**

When everything is set up, you should have:

1. **Supabase Database** (cloud)
   - Stores documents and versions
   - View at https://supabase.com/dashboard

2. **Backend Server** (localhost:4000)
   - REST API for documents
   - WebSocket server for real-time sync
   - Yjs persistence service

3. **Test Scripts** (as needed)
   - Run tests: `npm test`
   - Test persistence: `npx tsx test-persistence.ts`
   - Test auto-save: `npx tsx test-autosave.ts`

---

## 🎯 **Next: Test with Frontend**

Once Phase 6 is complete, you can test the full stack:
1. Start backend (this guide)
2. Start frontend (`cd frontend && npm run dev`)
3. Open http://localhost:3000
4. Draw shapes and see them persist!

---

## 📚 **Additional Resources**

- [Phase 4 Completion Report](docs/pr-completions/phase4/PHASE4_COMPLETION.md)
- [API Usage Guide](docs/guides/PHASE4_API_USAGE.md)
- [Database Setup Guide](SETUP_DATABASE.md)
- [Testing Guide](docs/guides/TESTING_GUIDE.md)

