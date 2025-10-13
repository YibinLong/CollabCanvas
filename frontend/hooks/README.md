# hooks/

**WHY:** Custom React hooks encapsulate reusable stateful logic.

**WHAT:** Will include:
- `useCanvas.ts` - Canvas interaction logic (pan, zoom, drawing)
- `useYjs.ts` - Yjs document synchronization
- `useAuth.ts` - Authentication state management
- `usePresence.ts` - User presence awareness

**EXAMPLE:**
```typescript
// Usage in a component:
const { shapes, addShape, updateShape } = useCanvas();
const { user, login, logout } = useAuth();
```

