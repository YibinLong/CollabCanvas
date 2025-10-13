# services/

**WHY:** Services encapsulate complex business logic and external integrations.

**WHAT:** Reusable modules that controllers can use:

```
services/
├── yjsService.ts        - Yjs document serialization/deserialization
├── openaiService.ts     - OpenAI API integration
├── supabaseService.ts   - Supabase client setup
└── prismaService.ts     - Prisma client singleton
```

**EXAMPLE:**
```typescript
// yjsService.ts
import * as Y from 'yjs';

export const serializeYDoc = (doc: Y.Doc): Buffer => {
  return Buffer.from(Y.encodeStateAsUpdate(doc));
};

export const deserializeYDoc = (data: Buffer): Y.Doc => {
  const doc = new Y.Doc();
  Y.applyUpdate(doc, new Uint8Array(data));
  return doc;
};
```

**WHY THIS PATTERN:**
- Keeps controllers thin and focused
- Makes complex logic testable in isolation
- Allows reuse across multiple controllers

