# middleware/

**WHY:** Middleware functions run before route handlers to perform cross-cutting operations.

**WHAT:** Common middleware we'll create:

```
middleware/
├── auth.ts              - Verify JWT tokens, attach user to request
├── validate.ts          - Validate request bodies against schemas
├── rateLimit.ts         - Rate limiting configuration
└── errorHandler.ts      - Centralized error handling
```

**EXAMPLE:**
```typescript
// auth.ts
export const requireAuth = async (req, res, next) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];
    if (!token) {
      return res.status(401).json({ error: 'No token provided' });
    }
    
    // Verify token with Supabase
    const user = await verifyToken(token);
    req.user = user; // Attach user to request
    next(); // Continue to next middleware or route handler
  } catch (error) {
    res.status(401).json({ error: 'Invalid token' });
  }
};
```

**USAGE:**
```typescript
// In a route file:
router.get('/documents', requireAuth, getDocuments);
//                       ^^^^^^^^^^^
//                       Middleware runs first
```

