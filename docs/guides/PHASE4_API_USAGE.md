# Phase 4 API Usage Guide

**Last Updated:** October 14, 2025  
**Phase:** 4 - Backend & Persistence

---

## Overview

This guide explains how to use the backend APIs implemented in Phase 4 for document management and Yjs persistence.

---

## Document Management API

### Base URL
```
http://localhost:4000/api/documents
```

### Authentication (Phase 4)
For now, include `x-user-id` header in all requests:
```
x-user-id: test-user-123
```

**Note:** This will be replaced with JWT tokens in Phase 5.

---

## Endpoints

### 1. List All Documents

**GET** `/api/documents`

**Purpose:** Get all documents owned by the authenticated user.

**Request:**
```bash
curl http://localhost:4000/api/documents \
  -H "x-user-id: test-user-123"
```

**Response (200):**
```json
{
  "documents": [
    {
      "id": "doc-uuid-1",
      "title": "My Design Project",
      "ownerId": "test-user-123",
      "createdAt": "2025-10-14T12:00:00.000Z",
      "updatedAt": "2025-10-14T12:30:00.000Z"
    }
  ]
}
```

**Notes:**
- Returns only documents owned by the authenticated user
- Sorted by most recently updated first
- Does NOT include `yjsState` (optimization for list view)

---

### 2. Create New Document

**POST** `/api/documents`

**Purpose:** Create a new canvas document.

**Request:**
```bash
curl -X POST http://localhost:4000/api/documents \
  -H "Content-Type: application/json" \
  -H "x-user-id: test-user-123" \
  -d '{
    "title": "My New Canvas"
  }'
```

**Request Body:**
```json
{
  "title": "My New Canvas"  // Optional, defaults to "Untitled"
}
```

**Response (201):**
```json
{
  "document": {
    "id": "new-doc-uuid",
    "title": "My New Canvas",
    "ownerId": "test-user-123",
    "yjsState": null,
    "createdAt": "2025-10-14T12:00:00.000Z",
    "updatedAt": "2025-10-14T12:00:00.000Z"
  }
}
```

**Notes:**
- New documents start with `yjsState: null` (empty canvas)
- Returns the complete document including ID

---

### 3. Get Document by ID

**GET** `/api/documents/:id`

**Purpose:** Load a specific document with its full Yjs state.

**Request:**
```bash
curl http://localhost:4000/api/documents/doc-uuid-1 \
  -H "x-user-id: test-user-123"
```

**Response (200):**
```json
{
  "document": {
    "id": "doc-uuid-1",
    "title": "My Design Project",
    "ownerId": "test-user-123",
    "yjsState": "<Buffer...>",  // Binary Yjs state
    "createdAt": "2025-10-14T12:00:00.000Z",
    "updatedAt": "2025-10-14T12:30:00.000Z"
  }
}
```

**Error Responses:**
- **404** - Document not found
  ```json
  { "error": "Document not found" }
  ```
- **403** - User doesn't own document
  ```json
  { "error": "Access denied" }
  ```

**Notes:**
- Includes full `yjsState` for loading canvas
- Only the owner can access their documents

---

### 4. Delete Document

**DELETE** `/api/documents/:id`

**Purpose:** Delete a document and all its versions.

**Request:**
```bash
curl -X DELETE http://localhost:4000/api/documents/doc-uuid-1 \
  -H "x-user-id: test-user-123"
```

**Response (200):**
```json
{
  "message": "Document deleted successfully"
}
```

**Error Responses:**
- **404** - Document not found
- **403** - User doesn't own document

**Notes:**
- Cascade deletes all document versions (handled by Prisma)
- This operation is permanent and cannot be undone

---

## Yjs Persistence Service

### Purpose

The persistence service handles saving and loading Yjs document state to/from PostgreSQL.

### Import

```typescript
import {
  saveYjsDocument,
  loadYjsDocument,
  handleClientDisconnect,
  saveVersion,
  loadVersion,
  startAutoSave,
  stopAutoSave,
  getVersionHistory,
} from './services/yjsPersistence';
```

---

## Persistence Functions

### 1. Save Yjs Document

```typescript
await saveYjsDocument(documentId: string, ydoc: Y.Doc): Promise<void>
```

**Purpose:** Save current canvas state to database.

**Example:**
```typescript
import * as Y from 'yjs';
import { saveYjsDocument } from './services/yjsPersistence';

const ydoc = new Y.Doc();
// ... modify document ...

await saveYjsDocument('doc-uuid-1', ydoc);
// Document saved!
```

**What it does:**
1. Serializes Yjs document to bytes using `Y.encodeStateAsUpdate()`
2. Stores in `yjsState` column as Buffer
3. Updates `updatedAt` timestamp

---

### 2. Load Yjs Document

```typescript
const ydoc = await loadYjsDocument(documentId: string): Promise<Y.Doc>
```

**Purpose:** Load saved canvas state from database.

**Example:**
```typescript
import { loadYjsDocument } from './services/yjsPersistence';

const ydoc = await loadYjsDocument('doc-uuid-1');
// ydoc now contains all saved shapes/text
```

**What it does:**
1. Queries database for document
2. Deserializes `yjsState` bytes using `Y.applyUpdate()`
3. Returns populated Yjs document

**Throws:**
- Error if document doesn't exist

---

### 3. Handle Client Disconnect

```typescript
await handleClientDisconnect(documentId: string, ydoc: Y.Doc): Promise<void>
```

**Purpose:** Save document when user disconnects.

**Example:**
```typescript
import { handleClientDisconnect } from './services/yjsPersistence';

// In WebSocket disconnect handler:
ws.on('close', async () => {
  await handleClientDisconnect(documentId, ydoc);
});
```

**What it does:**
1. Saves document immediately
2. Catches errors to ensure disconnect succeeds
3. Logs errors without throwing

---

### 4. Save Version Snapshot

```typescript
await saveVersion(
  documentId: string,
  ydoc: Y.Doc,
  label?: string
): Promise<void>
```

**Purpose:** Create a snapshot for version history.

**Example:**
```typescript
import { saveVersion } from './services/yjsPersistence';

// Save before AI changes
await saveVersion('doc-uuid-1', ydoc, 'Before AI grid layout');

// Save without label
await saveVersion('doc-uuid-1', ydoc);
```

**What it does:**
1. Saves snapshot to `DocumentVersion` table
2. Cleans up old versions (keeps last 50)
3. Optional label for description

---

### 5. Load Version Snapshot

```typescript
const ydoc = await loadVersion(versionId: string): Promise<Y.Doc>
```

**Purpose:** Restore a previous version.

**Example:**
```typescript
import { loadVersion } from './services/yjsPersistence';

const ydoc = await loadVersion('version-uuid-1');
// ydoc now contains that historical state
```

---

### 6. Start Auto-Save

```typescript
const interval = startAutoSave(
  documentId: string,
  ydoc: Y.Doc,
  intervalMs: number = 10000
): NodeJS.Timeout
```

**Purpose:** Automatically save document every N seconds.

**Example:**
```typescript
import { startAutoSave, stopAutoSave } from './services/yjsPersistence';

// Start auto-save every 10 seconds
const interval = startAutoSave('doc-uuid-1', ydoc, 10000);

// Later, stop auto-save when document is closed
stopAutoSave(interval);
```

**Default Interval:** 10 seconds (10000ms)

---

### 7. Get Version History

```typescript
const versions = await getVersionHistory(documentId: string)
```

**Purpose:** List all available versions.

**Example:**
```typescript
import { getVersionHistory } from './services/yjsPersistence';

const versions = await getVersionHistory('doc-uuid-1');
// [
//   { id: 'v1', label: 'Before AI changes', createdAt: '...' },
//   { id: 'v2', label: null, createdAt: '...' }
// ]
```

**Returns:**
```typescript
Array<{
  id: string;
  label: string | null;
  createdAt: Date;
}>
```

---

## Usage Flow

### Creating a New Document

```typescript
// 1. Create document via API
const response = await fetch('http://localhost:4000/api/documents', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'x-user-id': 'user-123',
  },
  body: JSON.stringify({ title: 'My Canvas' }),
});

const { document } = await response.json();
const documentId = document.id;

// 2. Create Yjs document
const ydoc = new Y.Doc();

// 3. Start auto-save
const interval = startAutoSave(documentId, ydoc, 10000);

// 4. User edits canvas...
// (auto-save runs every 10 seconds)

// 5. Save version before major change
await saveVersion(documentId, ydoc, 'Before AI changes');

// 6. On disconnect, save and cleanup
await handleClientDisconnect(documentId, ydoc);
stopAutoSave(interval);
```

---

### Loading an Existing Document

```typescript
// 1. Load document metadata via API
const response = await fetch(`http://localhost:4000/api/documents/${documentId}`, {
  headers: { 'x-user-id': 'user-123' },
});

const { document } = await response.json();

// 2. Load Yjs state
const ydoc = await loadYjsDocument(documentId);

// 3. Start auto-save
const interval = startAutoSave(documentId, ydoc, 10000);

// 4. User edits canvas...
```

---

### Restoring a Previous Version

```typescript
// 1. Get version history
const versions = await getVersionHistory(documentId);

// 2. Load specific version
const ydoc = await loadVersion(versions[0].id);

// 3. Optionally save as new version
await saveVersion(documentId, ydoc, 'Restored from v1');
```

---

## Testing

### Running Tests

```bash
# All tests
cd backend
npm test

# Specific test files
npm test -- documentApi.test.ts
npm test -- yjsPersistence.test.ts
```

### Test Coverage

```bash
npm test -- --coverage
```

---

## Troubleshooting

### "Cannot find module '../services/yjsPersistence'"
**Solution:** Make sure you're importing from the correct path. The service is at:
```
backend/src/services/yjsPersistence.ts
```

### "Document not found" error
**Solution:** Check that:
1. Document ID is correct
2. Document exists in database
3. User owns the document (check `ownerId`)

### "Unauthorized" error (401)
**Solution:** Make sure you're including the `x-user-id` header in your requests.

### "Access denied" error (403)
**Solution:** User is trying to access another user's document. Check ownership.

---

## Next Phase (Phase 5)

In Phase 5, we'll:
1. Replace mock auth with real JWT tokens from Supabase
2. Implement signup/login/logout
3. Secure WebSocket connections with JWT
4. Link presence to authenticated users

---

## Additional Resources

- [Phase 4 Completion Report](../pr-completions/phase4/PHASE4_COMPLETION.md)
- [Testing Guide](./TESTING_GUIDE.md)
- [PRD.md](../../PRD.md)
- [TASK_LIST.md](../../TASK_LIST.md)

