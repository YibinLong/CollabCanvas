# controllers/

**WHY:** Controllers contain the business logic for handling requests.
They process data, interact with the database, and return responses.

**WHAT:** Separates concerns - routes handle HTTP, controllers handle logic.

```
controllers/
├── documentController.ts   - Document operations (create, read, update, delete)
├── aiController.ts         - AI command processing
└── authController.ts       - Authentication logic
```

**PATTERN:**
```typescript
export const getDocuments = async (req, res) => {
  try {
    // 1. Validate input
    // 2. Call database via Prisma
    // 3. Return success response
  } catch (error) {
    // 4. Handle errors
    res.status(500).json({ error: 'Something went wrong' });
  }
};
```

**WHY THIS PATTERN:**
- Routes stay clean and focused on HTTP concerns
- Controllers can be tested independently
- Business logic is reusable across different routes

