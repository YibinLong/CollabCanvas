# Testing Guide for CollabCanvas

This guide explains how testing is set up in the CollabCanvas project and provides conventions and patterns for writing tests.

## Overview

This project follows **Test-Driven Development (TDD)** principles:
1. Write tests FIRST that describe the expected behavior
2. Run tests - they should FAIL
3. Implement code to make tests PASS
4. Do NOT modify tests to make them pass (unless tests were incorrect)

## Testing Stack

### Frontend
- **Jest** - Test runner and assertion library
- **React Testing Library** - For testing React components
- **@testing-library/user-event** - For simulating user interactions
- **@testing-library/jest-dom** - Custom matchers for DOM assertions

### Backend
- **Jest** - Test runner and assertion library
- **ts-jest** - TypeScript support for Jest
- **Supertest** - For testing HTTP endpoints

## Running Tests

### Frontend Tests
```bash
cd frontend

# Run all tests once
npm test

# Run tests in watch mode (re-runs on file changes)
npm run test:watch

# Run tests with coverage report
npm run test:coverage

# Run tests in CI mode (for GitHub Actions)
npm run test:ci
```

### Backend Tests
```bash
cd backend

# Run all tests once
npm test

# Run tests in watch mode
npm run test:watch

# Run tests with coverage report
npm run test:coverage

# Run tests in CI mode
npm run test:ci
```

## Test File Organization

### Frontend Structure
```
frontend/
├── __tests__/
│   ├── utils/              # Test utilities (mocks, helpers)
│   │   ├── mockYjs.ts      # Yjs mocking utilities
│   │   ├── mockAuth.ts     # Authentication mocks
│   │   └── mockWebSocket.ts # WebSocket mocks
│   ├── example.test.tsx    # Example tests
│   └── utils.test.ts       # Tests for test utilities
├── components/
│   └── Button.test.tsx     # Component-specific tests
└── lib/
    └── utils.test.ts       # Library function tests
```

### Backend Structure
```
backend/
└── src/
    ├── __tests__/
    │   ├── utils/              # Test utilities
    │   │   ├── mockYjs.ts      # Yjs mocking utilities
    │   │   ├── mockAuth.ts     # Auth & Express mocks
    │   │   ├── mockWebSocket.ts # WebSocket mocks
    │   │   └── testDatabase.ts  # Database helpers
    │   ├── global.d.ts         # Type definitions for tests
    │   ├── example.test.ts     # Example tests
    │   └── utils.test.ts       # Tests for test utilities
    ├── controllers/
    │   └── documentController.test.ts
    └── services/
        └── yjsService.test.ts
```

## Naming Conventions

### Test Files
- Component tests: `ComponentName.test.tsx`
- Function/module tests: `moduleName.test.ts`
- Place test files next to the code they test OR in `__tests__` directory
- Test files must end with `.test.ts`, `.test.tsx`, `.spec.ts`, or `.spec.tsx`

### Test Suites and Cases
```typescript
describe('ComponentName or Feature', () => {
  test('should do something specific', () => {
    // Test implementation
  })
  
  // Alternative: use 'it' instead of 'test'
  it('renders correctly', () => {
    // Test implementation
  })
})
```

## Writing Tests

### Frontend Component Tests

**WHY each part exists:**

```typescript
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import '@testing-library/jest-dom'
import Button from './Button'

describe('Button Component', () => {
  test('renders with text', () => {
    // RENDER: Creates a virtual DOM with the component
    render(<Button>Click Me</Button>)
    
    // FIND: Looks for an element with specific text
    // screen queries search the entire rendered component
    const button = screen.getByRole('button', { name: 'Click Me' })
    
    // ASSERT: Verifies the element exists in the document
    // toBeInTheDocument() comes from @testing-library/jest-dom
    expect(button).toBeInTheDocument()
  })

  test('calls onClick when clicked', async () => {
    // MOCK: Creates a fake function we can track
    const handleClick = jest.fn()
    
    // SETUP: userEvent simulates real user interactions
    const user = userEvent.setup()
    
    render(<Button onClick={handleClick}>Click Me</Button>)
    
    const button = screen.getByRole('button')
    
    // INTERACT: Simulates a user clicking the button
    await user.click(button)
    
    // VERIFY: Checks the function was called
    expect(handleClick).toHaveBeenCalledTimes(1)
  })
})
```

### Backend API Tests

**WHY each part exists:**

```typescript
import request from 'supertest'
import express from 'express'
import { documentRouter } from './routes/documents'

describe('Document API', () => {
  let app: express.Application

  beforeEach(() => {
    // SETUP: Create a fresh Express app for each test
    // This ensures tests don't affect each other
    app = express()
    app.use(express.json())
    app.use('/api/documents', documentRouter)
  })

  test('GET /api/documents returns documents', async () => {
    // SUPERTEST: Makes HTTP requests to your API
    // It doesn't need a running server - it calls Express directly
    const response = await request(app)
      .get('/api/documents')
      .set('Authorization', 'Bearer fake-token')
    
    // ASSERT: Check the response status and body
    expect(response.status).toBe(200)
    expect(response.body).toBeInstanceOf(Array)
  })

  test('POST /api/documents creates a document', async () => {
    const newDoc = { title: 'Test Document' }
    
    const response = await request(app)
      .post('/api/documents')
      .send(newDoc)
      .set('Authorization', 'Bearer fake-token')
    
    expect(response.status).toBe(201)
    expect(response.body).toHaveProperty('id')
    expect(response.body.title).toBe('Test Document')
  })
})
```

## Test Utilities

### Using Mock Yjs Documents

**Frontend Example:**
```typescript
import { createTestYDoc, createConnectedYDocs } from './__tests__/utils/mockYjs'

test('Yjs sync works', () => {
  // WHY: createConnectedYDocs makes two documents that sync with each other
  // This lets you test real-time collaboration without a server
  const [doc1, doc2] = createConnectedYDocs()
  
  // Make a change in doc1
  doc1.getMap('shapes').set('shape1', { x: 100, y: 100 })
  
  // The change automatically appears in doc2
  expect(doc2.getMap('shapes').get('shape1')).toEqual({ x: 100, y: 100 })
})
```

**Backend Example:**
```typescript
import { createTestYDoc, serializeYDoc } from './__tests__/utils/mockYjs'

test('can serialize and save Yjs document', () => {
  const doc = createTestYDoc()
  doc.getMap('shapes').set('shape1', { type: 'rect' })
  
  // WHY: serializeYDoc converts the document to bytes for database storage
  const bytes = serializeYDoc(doc)
  
  // Now you can save 'bytes' to the database
  expect(bytes).toBeInstanceOf(Uint8Array)
})
```

### Using Mock Authentication

**Frontend Example:**
```typescript
import { mockAuthContext } from './__tests__/utils/mockAuth'
import { AuthContext } from './contexts/AuthContext'

test('component shows user name when authenticated', () => {
  // WHY: mockAuthContext provides fake user data without real auth
  render(
    <AuthContext.Provider value={mockAuthContext}>
      <UserProfile />
    </AuthContext.Provider>
  )
  
  expect(screen.getByText('Test User')).toBeInTheDocument()
})
```

**Backend Example:**
```typescript
import { createExpressMocks } from './__tests__/utils/mockAuth'

test('middleware requires authentication', () => {
  // WHY: createExpressMocks creates fake req, res, next objects
  // This lets you test middleware in isolation
  const { req, res, next } = createExpressMocks()
  
  authMiddleware(req, res, next)
  
  // Verify middleware rejected the request
  expect(res.status).toHaveBeenCalledWith(401)
})
```

### Using Mock WebSockets

**Frontend Example:**
```typescript
import { MockWebSocket } from './__tests__/utils/mockWebSocket'

test('handles WebSocket messages', () => {
  const ws = new MockWebSocket('ws://test')
  const handler = jest.fn()
  ws.onmessage = handler
  
  ws.simulateOpen()
  ws.simulateMessage('hello')
  
  expect(handler).toHaveBeenCalledWith(
    expect.objectContaining({ data: 'hello' })
  )
})
```

## Common Testing Patterns

### 1. Testing Async Code

```typescript
// Using async/await
test('loads data', async () => {
  const data = await fetchData()
  expect(data).toBeDefined()
})

// Using promises
test('loads data', () => {
  return fetchData().then(data => {
    expect(data).toBeDefined()
  })
})
```

### 2. Testing Errors

```typescript
// Synchronous errors
test('throws error for invalid input', () => {
  expect(() => {
    processData(null)
  }).toThrow('Invalid input')
})

// Async errors
test('rejects for invalid input', async () => {
  await expect(processDataAsync(null)).rejects.toThrow('Invalid input')
})
```

### 3. Using beforeEach / afterEach

```typescript
describe('Database tests', () => {
  let db: Database
  
  // WHY: beforeEach runs before EACH test
  // This ensures every test starts with a clean state
  beforeEach(() => {
    db = new Database()
    db.connect()
  })
  
  // WHY: afterEach runs after EACH test
  // This cleans up resources so tests don't leak memory
  afterEach(() => {
    db.disconnect()
  })
  
  test('can save data', () => {
    // db is fresh and connected
    db.save({ name: 'test' })
  })
  
  test('can load data', () => {
    // db is fresh again (previous test's data is gone)
    db.save({ name: 'test' })
    const data = db.load()
    expect(data.name).toBe('test')
  })
})
```

### 4. Testing React Hooks

```typescript
import { renderHook, act } from '@testing-library/react'
import { useCounter } from './useCounter'

test('counter increments', () => {
  // WHY: renderHook lets you test hooks in isolation
  const { result } = renderHook(() => useCounter())
  
  expect(result.current.count).toBe(0)
  
  // WHY: act() ensures state updates are processed
  act(() => {
    result.current.increment()
  })
  
  expect(result.current.count).toBe(1)
})
```

### 5. Mocking Modules

```typescript
// Mock an entire module
jest.mock('./api', () => ({
  fetchData: jest.fn(() => Promise.resolve({ data: 'mocked' }))
}))

test('uses mocked API', async () => {
  const data = await fetchData()
  expect(data).toEqual({ data: 'mocked' })
})
```

## Coverage Thresholds

We maintain these minimum coverage levels:
- **Branches:** 70%
- **Functions:** 70%
- **Lines:** 70%
- **Statements:** 70%

These are configured in `jest.config.js` and enforced when running `npm run test:coverage`.

**WHY coverage matters:** Code coverage tells you what percentage of your code is executed during tests. Higher coverage means fewer untested code paths where bugs can hide.

## Best Practices

### 1. **Test behavior, not implementation**
❌ Bad: Testing internal state
```typescript
test('sets state correctly', () => {
  const component = new Component()
  component.handleClick()
  expect(component.state.clicked).toBe(true) // Testing internal state
})
```

✅ Good: Testing user-visible behavior
```typescript
test('shows message when clicked', () => {
  render(<Component />)
  const button = screen.getByRole('button')
  userEvent.click(button)
  expect(screen.getByText('Clicked!')).toBeInTheDocument() // Testing what user sees
})
```

**WHY:** If you refactor the component's internals (e.g., use different state management), tests that check implementation details will break even though the behavior is correct. Tests should verify what users care about.

### 2. **Keep tests simple and focused**
Each test should verify ONE thing. If a test fails, you should immediately know what's broken.

❌ Bad: Testing multiple things
```typescript
test('button works', () => {
  render(<Button />)
  expect(button).toBeInTheDocument()
  expect(button).toHaveClass('btn')
  userEvent.click(button)
  expect(onClick).toHaveBeenCalled()
  // Too much in one test!
})
```

✅ Good: Separate concerns
```typescript
test('renders button', () => {
  render(<Button />)
  expect(screen.getByRole('button')).toBeInTheDocument()
})

test('calls onClick when clicked', () => {
  const onClick = jest.fn()
  render(<Button onClick={onClick} />)
  userEvent.click(screen.getByRole('button'))
  expect(onClick).toHaveBeenCalled()
})
```

### 3. **Use descriptive test names**
Test names should describe WHAT is being tested and WHAT the expected outcome is.

❌ Bad:
```typescript
test('test 1', () => { ... })
test('works', () => { ... })
```

✅ Good:
```typescript
test('renders loading spinner when data is fetching', () => { ... })
test('displays error message when API call fails', () => { ... })
```

### 4. **Avoid testing third-party libraries**
Don't write tests that verify third-party libraries work. Assume they do.

❌ Bad:
```typescript
test('useState works', () => {
  const [value, setValue] = useState(0)
  setValue(1)
  expect(value).toBe(1) // Testing React, not your code
})
```

✅ Good:
```typescript
test('counter increments when button clicked', () => {
  render(<Counter />)
  userEvent.click(screen.getByText('Increment'))
  expect(screen.getByText('Count: 1')).toBeInTheDocument()
})
```

### 5. **Use test utilities for common patterns**
Create reusable utilities for frequently-used test setups.

```typescript
// In test utils
function renderWithAuth(component: React.ReactElement) {
  return render(
    <AuthContext.Provider value={mockAuthContext}>
      {component}
    </AuthContext.Provider>
  )
}

// In tests
test('shows user profile', () => {
  renderWithAuth(<UserProfile />)
  expect(screen.getByText('Test User')).toBeInTheDocument()
})
```

## Debugging Tests

### View rendered HTML
```typescript
import { screen } from '@testing-library/react'

test('my test', () => {
  render(<MyComponent />)
  screen.debug() // Prints the entire DOM
  screen.debug(screen.getByRole('button')) // Prints just the button
})
```

### Use test.only to run one test
```typescript
test.only('this test runs alone', () => {
  // Only this test runs, all others are skipped
})
```

### Skip tests temporarily
```typescript
test.skip('fix this later', () => {
  // This test is skipped
})
```

### Check what queries are available
```typescript
import { screen, logRoles } from '@testing-library/react'

test('debug roles', () => {
  const { container } = render(<MyComponent />)
  logRoles(container) // Shows all ARIA roles in the component
})
```

## Continuous Integration

Tests run automatically on every commit via GitHub Actions. The CI pipeline:
1. Installs dependencies
2. Runs `npm run test:ci` (runs tests with coverage)
3. Fails the build if tests fail or coverage is below thresholds

## Resources

- [Jest Documentation](https://jestjs.io/)
- [React Testing Library](https://testing-library.com/react)
- [Testing Library Queries](https://testing-library.com/docs/queries/about/)
- [Common Testing Mistakes](https://kentcdodds.com/blog/common-mistakes-with-react-testing-library)

## Questions?

If you're unsure how to test something, look at the existing tests in `__tests__/example.test.tsx` or `__tests__/utils.test.ts` for examples. When in doubt, test the user-visible behavior!

