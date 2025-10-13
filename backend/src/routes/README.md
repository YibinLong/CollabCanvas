# routes/

**WHY:** Routes define the API endpoints that the frontend can call.

**WHAT:** Each file defines routes for a specific feature:

```
routes/
├── documents.ts      - Document CRUD operations
│                      GET /api/documents (list)
│                      POST /api/documents (create)
│                      GET /api/documents/:id (get one)
│                      PUT /api/documents/:id (update)
│                      DELETE /api/documents/:id (delete)
│
├── ai.ts             - AI command interpretation
│                      POST /api/ai/interpret (send prompt, get operations)
│
└── auth.ts           - Authentication helpers
                       POST /api/auth/verify (verify JWT token)
```

**PATTERN:**
```typescript
import express from 'express';
const router = express.Router();

router.get('/', async (req, res) => {
  // Call controller function
});

export default router;
```

