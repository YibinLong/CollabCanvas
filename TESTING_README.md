# Testing Infrastructure - Quick Start

## ✅ PR #3: Testing Infrastructure Setup - COMPLETE

All testing infrastructure has been successfully set up and verified!

## What Was Accomplished

### 1. **Testing Dependencies Installed**
- ✅ Frontend: Jest, React Testing Library, user-event, jest-dom
- ✅ Backend: Jest, ts-jest, supertest

### 2. **Jest Configuration**
- ✅ Frontend: `jest.config.js` configured for Next.js
- ✅ Backend: `jest.config.js` configured for Node.js with TypeScript
- ✅ Coverage thresholds set to 70% for all metrics
- ✅ Setup files created for both projects

### 3. **Test Utilities Created**
- ✅ **Mock Yjs:** Create test documents, simulate sync between clients
- ✅ **Mock Auth:** Fake users, sessions, JWT tokens, Supabase client
- ✅ **Mock WebSocket:** Simulate WebSocket connections and messaging
- ✅ **Database Helpers:** (Backend) Create test data, clear database

### 4. **Test Scripts Added**
```bash
npm test              # Run all tests once
npm run test:watch    # Run tests in watch mode
npm run test:coverage # Run tests with coverage report
npm run test:ci       # Run tests in CI mode
```

### 5. **Example Tests**
- ✅ Frontend: 17 passing tests
- ✅ Backend: 22 passing tests
- ✅ All tests verify the infrastructure works correctly

### 6. **Documentation**
- ✅ Comprehensive testing guide created at `docs/guides/TESTING_GUIDE.md`
- ✅ Explains WHY each piece of code exists (for beginners)
- ✅ Includes patterns, best practices, and debugging tips

## Quick Test Run

### Test Frontend
```bash
cd frontend
npm test
```

Expected output: ✅ All 17 tests passing

### Test Backend
```bash
cd backend
npm test
```

Expected output: ✅ All 22 tests passing

## File Structure

### Frontend Testing Files
```
frontend/
├── __tests__/
│   ├── utils/
│   │   ├── mockYjs.ts         # Yjs mocking utilities
│   │   ├── mockAuth.ts        # Authentication mocks
│   │   └── mockWebSocket.ts   # WebSocket mocks
│   ├── example.test.tsx       # Example React component tests
│   └── utils.test.ts          # Tests for test utilities
├── jest.config.js             # Jest configuration
└── jest.setup.js              # Test setup (runs before all tests)
```

### Backend Testing Files
```
backend/
├── src/
│   └── __tests__/
│       ├── utils/
│       │   ├── mockYjs.ts          # Yjs mocking utilities
│       │   ├── mockAuth.ts         # Auth & Express mocks
│       │   ├── mockWebSocket.ts    # WebSocket mocks
│       │   └── testDatabase.ts     # Database helpers
│       ├── global.d.ts             # TypeScript type definitions
│       ├── example.test.ts         # Example Node.js tests
│       └── utils.test.ts           # Tests for test utilities
├── jest.config.js                  # Jest configuration
└── jest.setup.ts                   # Test setup
```

## What's Next: PR #4 (Canvas Tests)

Now that testing infrastructure is ready, you can begin TDD for the canvas:

**PR #4: Canvas Tests - Basic UI & SVG Rendering** (Write tests first)
- Write test: Canvas component renders with SVG element
- Write test: Pan works with mouse drag
- Write test: Zoom works with mouse wheel
- Write test: Basic shapes render (Rectangle, Circle)
- Write test: Zustand store updates viewport state

**PR #5: Canvas Implementation** (Make tests pass)
- Implement canvas features until all PR #4 tests pass

## Key Testing Utilities

### Create Mock Yjs Documents
```typescript
import { createTestYDoc, createConnectedYDocs } from './__tests__/utils/mockYjs'

// Single document
const doc = createTestYDoc()

// Two syncing documents
const [doc1, doc2] = createConnectedYDocs()
doc1.getMap('shapes').set('shape1', data)
// Automatically appears in doc2!
```

### Mock Authentication
```typescript
import { mockUser, mockAuthContext } from './__tests__/utils/mockAuth'

// Use in React component tests
<AuthContext.Provider value={mockAuthContext}>
  <YourComponent />
</AuthContext.Provider>
```

### Mock WebSocket
```typescript
import { MockWebSocket } from './__tests__/utils/mockWebSocket'

const ws = new MockWebSocket('ws://test')
ws.simulateOpen()
ws.simulateMessage('hello')
expect(ws.sentMessages).toContain('response')
```

## Coverage Reports

Run coverage to see what code is tested:
```bash
npm run test:coverage
```

This generates:
- Console summary of coverage percentages
- HTML report in `coverage/` directory (open `coverage/index.html` in browser)

## Troubleshooting

### Tests won't run
```bash
# Make sure dependencies are installed
npm install

# Clear Jest cache
npx jest --clearCache

# Try running tests with verbose output
npm test -- --verbose
```

### TypeScript errors in tests
- Make sure `jest.config.js` is properly configured
- Check that test files are in the right location
- Verify type definitions in `global.d.ts` (backend)

### Import errors
- Frontend: Check module aliases in `jest.config.js` match `tsconfig.json`
- Backend: Ensure paths are correct relative to test files

## Documentation

📚 **Full Testing Guide:** See `docs/guides/TESTING_GUIDE.md` for:
- Detailed explanations of testing concepts
- Step-by-step examples
- Best practices and patterns
- Debugging tips
- Common mistakes to avoid

## Testing Philosophy

This project follows **Test-Driven Development (TDD)**:
1. ✍️ **Write tests FIRST** - Describe what you want to build
2. 🔴 **See them FAIL** - Confirms tests actually test something
3. ✅ **Make them PASS** - Implement the feature
4. 🔄 **Refactor** - Improve code while keeping tests green

**Why TDD?**
- Catches bugs early
- Documents how code should work
- Makes refactoring safe
- Forces you to think about design upfront

## Success Criteria ✅

All items from PR #3 task list completed:
- [x] Set up Jest and React Testing Library for frontend
- [x] Set up Jest for backend unit tests
- [x] Create test utilities (mock Yjs docs, mock auth, test WebSocket client)
- [x] Configure test scripts in package.json
- [x] Set up test coverage reporting
- [x] Create example test files to verify setup works
- [x] Document testing conventions and patterns

## Stats

- **Frontend:** 17 tests passing ✅
- **Backend:** 22 tests passing ✅
- **Test utilities:** 6 mock utilities created
- **Documentation:** Comprehensive 600+ line testing guide
- **Total lines of test code:** ~1,500+ lines

---

**PR #3 Status: ✅ COMPLETE**

Testing infrastructure is fully set up and ready for TDD development!

