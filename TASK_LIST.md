# CollabCanvas Development Task List

This document outlines the complete implementation plan for the Figma clone project, organized into 39 progressive Pull Requests (PRs).

**⚠️ TDD APPROACH:** This task list follows Test-Driven Development principles. For each feature, tests are written FIRST, then implementation follows to make tests pass.

**🎯 SIMPLIFIED TESTING:** Tests focus on **core functionality and happy paths only**. We're not aiming for 100% coverage or testing every edge case - just ensuring the main features work correctly.

---

## Phase 1: Foundation & Testing Infrastructure

### PR #1: Project Setup & Initial Configuration
**Status:** ✅ COMPLETE

**Tasks:**
- ✅ Initialize Next.js frontend with TypeScript, TailwindCSS, and ESLint/Prettier
- ✅ Create folder structure (components, lib, hooks, types)
- ✅ Initialize backend Node.js/TypeScript project with Express
- ✅ Set up package.json for both projects with all required dependencies (Zustand, Yjs, y-websocket, etc.)
- ✅ Create .gitignore and .env.example files
- ✅ Create comprehensive README documentation

**Why:** Establishes the foundational structure for both frontend and backend projects with all necessary tooling and dependencies configured.

---

### PR #2: Database Schema & Prisma Setup
**Status:** ✅ COMPLETE

**Tasks:**
- ✅ Install Prisma and initialize with PostgreSQL
- ✅ Create schema.prisma with models for:
  - ✅ Document (id, title, owner_id, yjs_state, created_at, updated_at)
  - ✅ DocumentVersion (snapshot history)
  - ✅ User metadata
- ✅ Generate Prisma client
- ✅ Write database migrations (using db:push for Supabase compatibility)
- ✅ Create seed data for testing

**Why:** Defines the data models and sets up the ORM layer that will handle all database operations throughout the application.

---

### PR #3: Testing Infrastructure Setup
**Status:** Complete ✅

**Tasks:**
- ✅ Set up Jest and React Testing Library for frontend
- ✅ Set up Jest for backend unit tests
- ✅ Create test utilities (mock Yjs docs, mock auth, test WebSocket client)
- ✅ Configure test scripts in package.json
- ✅ Set up test coverage reporting
- ✅ Create example test files to verify setup works (39 tests passing)
- ✅ Document testing conventions and patterns

**Why:** CRITICAL for TDD - must set up testing infrastructure BEFORE writing any feature tests or implementation code.

**Results:**
- 17 frontend tests passing
- 22 backend tests passing
- 6 comprehensive mock utilities created
- Full documentation in `docs/guides/TESTING_GUIDE.md` and `TESTING_README.md`
- See completion report: `docs/pr-completions/pr3/PR3_COMPLETION.md`

---

## Phase 2: Core Canvas (TDD)

### PR #4: Canvas Tests - Basic UI & SVG Rendering
**Status:** Pending
**TDD Step:** ✍️ WRITE TESTS FIRST

**Tasks:**
- Write test: Canvas component renders with SVG element
- Write test: Pan works with mouse drag
- Write test: Zoom works with mouse wheel
- Write test: Basic shapes render (Rectangle, Circle)
- Write test: Zustand store updates viewport state

**Why:** (TDD) Write failing tests for core canvas behavior. Focus on happy path, not edge cases.

---

### PR #5: Canvas Implementation - Basic UI & SVG Rendering
**Status:** Pending
**TDD Step:** ✅ MAKE TESTS PASS

**Tasks:**
- Create Canvas component with SVG viewport
- Implement pan and zoom functionality (mouse/trackpad gestures, space+drag shortcut)
- Create basic shape components (Rectangle, Circle, Line, Text) with SVG rendering
- Add toolbar UI for shape selection
- Set up Zustand store for local canvas state (shapes, viewport transform)
- Ensure 60 FPS performance
- **Run tests from PR #4 - all should pass**

**Why:** (TDD) Implement code until all tests from PR #4 pass. Do not modify tests unless they were incorrect.

---

### PR #6: Canvas Tests - Shape Creation & Manipulation
**Status:** Pending
**TDD Step:** ✍️ WRITE TESTS FIRST

**Tasks:**
- Write test: Click to create a shape
- Write test: Click to select a shape
- Write test: Drag to move selected shape
- Write test: Drag handle to resize shape

**Why:** (TDD) Write failing tests for core shape operations. Keep it simple.

---

### PR #7: Canvas Implementation - Shape Creation & Manipulation
**Status:** Pending
**TDD Step:** ✅ MAKE TESTS PASS

**Tasks:**
- Implement shape creation on canvas click/drag
- Add selection logic (single click to select)
- Create visual selection handles (resize corners, rotation handle)
- Implement move functionality (drag selected shapes)
- Implement resize functionality (drag corner handles)
- Implement rotation functionality (drag rotation handle)
- Add shape property panel (x, y, width, height, rotation, color)
- **Run tests from PR #6 - all should pass**

**Why:** (TDD) Implement shape manipulation features to pass all tests from PR #6.

---

### PR #8: Canvas Tests - Advanced Selection & Layers
**Status:** Pending
**TDD Step:** ✍️ WRITE TESTS FIRST

**Tasks:**
- Write test: Select multiple shapes
- Write test: Delete key removes selected shape
- Write test: Bring shape to front/send to back

**Why:** (TDD) Write failing tests for essential multi-object features only.

---

### PR #9: Canvas Implementation - Advanced Selection & Layers
**Status:** Pending
**TDD Step:** ✅ MAKE TESTS PASS

**Tasks:**
- Implement multi-selection
- Add layer reordering (bring to front, send to back)
- Implement delete keyboard shortcut
- **Run tests from PR #8 - all should pass**

**Why:** (TDD) Implement advanced features to pass all tests from PR #8.

---

## Phase 3: Real-Time Collaboration (TDD)

### PR #10: Yjs Integration Tests
**Status:** Pending
**TDD Step:** ✍️ WRITE TESTS FIRST

**Tasks:**
- Write test: Yjs document initializes with Y.Map
- Write test: Shape added to Zustand syncs to Yjs
- Write test: WebSocket connects successfully
- Write test: Two clients sync shape creation

**Why:** (TDD) Write failing tests for core real-time sync functionality.

---

### PR #11: Yjs Client-Side Implementation
**Status:** Pending
**TDD Step:** ✅ MAKE TESTS PASS

**Tasks:**
- Install Yjs and y-websocket on frontend
- Create Yjs document structure for canvas state (Y.Map for shapes)
- Implement sync between Zustand store and Yjs document (bidirectional)
- Set up WebSocket provider to connect to backend (placeholder URL)
- Add connection status indicator
- Handle reconnection logic
- **Run tests from PR #10 - all should pass**

**Why:** (TDD) Implement Yjs client integration to pass all tests from PR #10.

---

### PR #12: WebSocket Server Tests
**Status:** Pending
**TDD Step:** ✍️ WRITE TESTS FIRST

**Tasks:**
- Write test: WebSocket server starts successfully
- Write test: Client can join a document room
- Write test: Two clients sync updates

**Why:** (TDD) Write failing tests for core WebSocket functionality.

---

### PR #13: WebSocket Server Implementation
**Status:** Pending
**TDD Step:** ✅ MAKE TESTS PASS

**Tasks:**
- Set up y-websocket server on backend (separate from Express)
- Configure WebSocket server to handle multiple document rooms
- Implement document room management (join/leave)
- Add connection authentication (JWT validation)
- Enable bidirectional sync between clients
- Monitor and log sync latency (target <100ms)
- Add health check endpoint
- **Run tests from PR #12 - all should pass**

**Why:** (TDD) Implement WebSocket server to pass all tests from PR #12.

---

### PR #14: Multiplayer Presence Tests
**Status:** Pending
**TDD Step:** ✍️ WRITE TESTS FIRST

**Tasks:**
- Write test: User cursor displays with name
- Write test: Multiple users' cursors render
- Write test: Presence list shows connected users

**Why:** (TDD) Write failing tests for core presence features.

---

### PR #15: Multiplayer Presence Implementation
**Status:** Pending
**TDD Step:** ✅ MAKE TESTS PASS

**Tasks:**
- Implement Yjs Awareness for user presence
- Create CursorOverlay component to render other users' cursors
- Assign distinct colors to each user
- Display user names next to cursors
- Create presence list UI showing connected users
- Track and broadcast cursor position in real-time
- Add user join/leave animations
- Handle cursor rendering performance with multiple users
- **Run tests from PR #14 - all should pass**

**Why:** (TDD) Implement presence features to pass all tests from PR #14.

---

## Phase 4: Backend & Persistence (TDD)

### PR #16: Backend API Tests - Document Management
**Status:** Pending
**TDD Step:** ✍️ WRITE TESTS FIRST

**Tasks:**
- Write test: GET /api/documents returns list
- Write test: POST /api/documents creates document
- Write test: GET /api/documents/:id loads document
- Write test: DELETE /api/documents/:id deletes document

**Why:** (TDD) Write failing tests for core CRUD operations.

---

### PR #17: Backend API Implementation - Document Management
**Status:** Pending
**TDD Step:** ✅ MAKE TESTS PASS

**Tasks:**
- Create Express routes for all document operations
- Implement controllers using Prisma
- Add request validation middleware
- Implement CORS configuration (localhost:3000 and production frontend URL)
- Add error handling and logging
- Write API documentation
- **Run tests from PR #16 - all should pass**

**Why:** (TDD) Implement document API to pass all tests from PR #16.

---

### PR #18: Yjs Persistence Tests
**Status:** Pending
**TDD Step:** ✍️ WRITE TESTS FIRST

**Tasks:**
- Write test: Save Yjs document to database
- Write test: Load Yjs document from database
- Write test: Document persists after disconnect

**Why:** (TDD) Write failing tests for core persistence functionality.

---

### PR #19: Yjs Persistence Implementation
**Status:** Pending
**TDD Step:** ✅ MAKE TESTS PASS

**Tasks:**
- Implement periodic snapshot saving (every 10 seconds or on disconnect)
- Create service to serialize Yjs document state to PostgreSQL via Prisma
- Implement document loading from database on client connect
- Create version history (save last 50 snapshots in DocumentVersion table)
- Add restore from version functionality
- Handle persistence with multiple concurrent users
- Handle large document optimization
- **Run tests from PR #18 - all should pass**

**Why:** (TDD) Implement persistence features to pass all tests from PR #18.

---

## Phase 5: Authentication (TDD)

### PR #20: Authentication Tests
**Status:** Pending
**TDD Step:** ✍️ WRITE TESTS FIRST

**Tasks:**
- Write test: User can signup with email/password
- Write test: User can login
- Write test: User can logout
- Write test: Protected routes require auth

**Why:** (TDD) Write failing tests for core auth flow.

---

### PR #21: Supabase Authentication Implementation
**Status:** Pending
**TDD Step:** ✅ MAKE TESTS PASS

**Tasks:**
- Create Supabase project and configure Auth
- Install Supabase client libraries (frontend and backend)
- Create authentication context provider on frontend
- Implement signup page/component with email/password
- Implement login page/component
- Implement logout functionality
- Add protected route middleware
- Create auth helper functions for JWT validation
- Set up session persistence
- **Run tests from PR #20 - all should pass**

**Why:** (TDD) Implement authentication to pass all tests from PR #20.

---

### PR #22: Auth Integration Tests
**Status:** Pending
**TDD Step:** ✍️ WRITE TESTS FIRST

**Tasks:**
- Write test: API routes require authentication
- Write test: Documents are owned by creator
- Write test: User identity shows in presence

**Why:** (TDD) Write failing tests for auth integration with app features.

---

### PR #23: Auth Integration Implementation
**Status:** Pending
**TDD Step:** ✅ MAKE TESTS PASS

**Tasks:**
- Add JWT authentication to WebSocket connections
- Protect all backend API routes with auth middleware
- Link document ownership to authenticated users
- Implement document sharing permissions (owner only for MVP)
- Add user profile in UI header
- Link presence awareness to authenticated user identity (name, email)
- Handle auth token refresh
- **Run tests from PR #22 - all should pass**

**Why:** (TDD) Integrate authentication throughout the app to pass all tests from PR #22.

---

## Phase 6: AI Integration (TDD)

### PR #24: OpenAI Integration Tests
**Status:** Pending
**TDD Step:** ✍️ WRITE TESTS FIRST

**Tasks:**
- Write test: /api/ai/interpret endpoint accepts prompt
- Write test: AI returns structured function call
- Write test: Invalid prompts return error

**Why:** (TDD) Write failing tests for core AI endpoint functionality.

---

### PR #25: OpenAI Integration Implementation
**Status:** Pending
**TDD Step:** ✅ MAKE TESTS PASS

**Tasks:**
- Install OpenAI SDK on backend
- Create /api/ai/interpret endpoint
- Define OpenAI function schemas for: createShape, moveShape, resizeShape, rotateShape, createText, arrangeShapes, groupShapes
- Implement function calling with GPT-4
- Parse and validate function call responses
- Add rate limiting and error handling
- Log all AI interactions
- **Run tests from PR #24 - all should pass**

**Why:** (TDD) Implement OpenAI integration to pass all tests from PR #24.

---

### PR #26: AI Canvas Operations Tests
**Status:** Pending
**TDD Step:** ✍️ WRITE TESTS FIRST

**Tasks:**
- Write test: createShape adds shape to canvas
- Write test: moveShape updates shape position
- Write test: arrangeShapes creates grid layout
- Write test: AI changes sync to other clients

**Why:** (TDD) Write failing tests for core AI operations.

---

### PR #27: AI Canvas Operations Implementation
**Status:** Pending
**TDD Step:** ✅ MAKE TESTS PASS

**Tasks:**
- Implement createShape operation (supports all shape types with properties)
- Implement moveShape operation (relative and absolute positioning)
- Implement resizeShape operation
- Implement rotateShape operation
- Implement createText operation with fontSize support
- Implement arrangeShapes operation (horizontal, vertical, grid layouts with spacing)
- Implement groupShapes operation
- Broadcast all AI operations to connected clients via Yjs
- **Run tests from PR #26 - all should pass**

**Why:** (TDD) Implement AI canvas operations to pass all tests from PR #26.

---

### PR #28: AI Assistant UI Tests
**Status:** Pending
**TDD Step:** ✍️ WRITE TESTS FIRST

**Tasks:**
- Write test: AI panel opens and closes
- Write test: User can submit prompt
- Write test: Loading state displays during AI request

**Why:** (TDD) Write failing tests for core AI UI interactions.

---

### PR #29: AI Assistant UI Implementation
**Status:** Pending
**TDD Step:** ✅ MAKE TESTS PASS

**Tasks:**
- Create AI chat panel/modal component
- Add text input for natural language commands
- Display AI loading state and responses
- Show visual feedback when AI operates on canvas
- Add example prompts/suggestions
- Implement command history
- Add error handling and user-friendly error messages
- Style with TailwindCSS
- Create AI_LOG.md and log first interactions
- **Run tests from PR #28 - all should pass**

**Why:** (TDD) Implement AI UI to pass all tests from PR #28.

---

## Phase 7: Optimization & Security

### PR #30: Performance Optimization
**Status:** Pending

**Tasks:**
- Implement canvas virtualization for 500+ objects
- Optimize SVG rendering (use CSS transforms for positioning)
- Implement throttling/debouncing for cursor updates
- Optimize Yjs update batching
- Add performance monitoring (FPS counter, sync latency display)
- Implement lazy loading for document list
- Optimize database queries with indexes
- Add caching where appropriate
- Run performance benchmarks and document results

**Why:** Ensures the application meets performance targets (60 FPS, <100ms sync latency, 500+ objects) specified in the PRD.

---

### PR #31: Security Hardening
**Status:** Pending

**Tasks:**
- Implement rate limiting on all API endpoints
- Add rate limiting on WebSocket connections
- Add rate limiting on AI endpoint (per user)
- Validate all user inputs (sanitization, schema validation)
- Implement proper CORS configuration for production
- Ensure all secrets in environment variables
- Add security headers (helmet.js)
- Implement proper error messages (no sensitive data leaks)
- Add request logging with trace IDs
- Security audit and penetration testing checklist

**Why:** Protects the application from common security vulnerabilities and abuse.

---

### PR #32: Error Handling & Logging
**Status:** Pending

**Tasks:**
- Implement structured JSON logging on backend
- Add log levels (debug, info, warn, error)
- Create error boundary component for frontend
- Implement user-friendly error messages
- Add DEBUG flag for verbose frontend logging
- Log all WebSocket events (connect, disconnect, errors)
- Log Yjs update sizes and sync times
- Log AI function calls with trace IDs
- Create /health and /metrics endpoints
- Set up error monitoring hooks (prepare for Sentry integration)

**Why:** Makes debugging and monitoring easier by providing comprehensive, structured logs throughout the application.

---

## Phase 8: Polish & Deployment

### PR #33: UI/UX Polish & Styling
**Status:** Pending

**Tasks:**
- Create beautiful, modern UI with TailwindCSS
- Design and implement top toolbar (tools, shapes, AI button)
- Design and implement properties panel
- Add dark mode support (optional but recommended)
- Implement loading states and skeletons
- Add smooth animations and transitions
- Create onboarding/welcome screen
- Design document list/dashboard page
- Add keyboard shortcut help modal
- Ensure responsive design
- Conduct UX testing and iterate

**Why:** Creates a polished, professional user experience that makes the application enjoyable to use.

---

### PR #34: Deployment Preparation
**Status:** Pending

**Tasks:**
- Create production .env.example for both frontend and backend
- Write comprehensive README.md with setup instructions
- Document Supabase setup steps
- Document Render deployment steps
- Document Vercel deployment steps
- Create deployment scripts if needed
- Set up GitHub Actions for CI/CD (optional)
- Test local production builds
- Create deployment troubleshooting guide
- Document environment variable configuration for all platforms

**Why:** Prepares all documentation and configuration needed for smooth deployment to production.

---

### PR #35: Supabase Setup & Configuration
**Status:** Pending

**Tasks:**
- Create Supabase project in dashboard
- Enable Authentication service
- Enable PostgreSQL database
- Create database tables via Prisma migrations
- Configure Auth providers and settings
- Copy Supabase URL, anon key, service key
- Test database connection
- Set up Row Level Security policies if needed
- Document any manual configuration steps
- Test authentication from local development

**Why:** Sets up the production database and authentication service in Supabase.

---

### PR #36: Backend Deployment to Render
**Status:** Pending

**Tasks:**
- Create Render account and new Web Service
- Configure build command: npm install && npm run build
- Configure start command: node dist/server.js
- Add all environment variables in Render dashboard
- Configure health check endpoint
- Deploy backend
- Test WebSocket connectivity
- Test REST API endpoints
- Monitor logs for errors
- Update frontend .env with production backend URLs
- Test end-to-end with production backend

**Why:** Deploys the backend to Render, making it accessible from the internet.

---

### PR #37: Frontend Deployment to Vercel
**Status:** Pending

**Tasks:**
- Create Vercel account and import GitHub repo
- Configure NEXT_PUBLIC_API_URL (Render backend URL)
- Configure NEXT_PUBLIC_WS_URL (Render WebSocket URL)
- Configure Supabase environment variables
- Deploy frontend
- Test production build
- Test authentication flow in production
- Test real-time collaboration in production
- Test AI functionality in production
- Monitor Vercel logs
- Fix any production-specific issues

**Why:** Deploys the frontend to Vercel, making the complete application accessible to users.

---

## Phase 9: Launch

### PR #38: End-to-End Integration Testing
**Status:** Pending

**Tasks:**
- Test complete user journey: signup → login → create document → draw shapes
- Test real-time collaboration with 2-3 users simultaneously
- Test AI commands with multiple users observing
- Test persistence (create shapes, refresh page, verify data persists)
- Test document list and navigation
- Test performance with 500+ objects
- Test connection resilience (disconnect/reconnect)
- Test across different browsers
- Document any bugs or issues
- Create bug fix backlog

**Why:** Validates that all features work correctly together in the production environment.

---

### PR #39: Final Documentation & Cleanup
**Status:** Pending

**Tasks:**
- Complete README.md with architecture overview
- Add code comments and JSDoc where needed
- Document API endpoints with examples
- Document AI commands and capabilities
- Create user guide/documentation
- Update AI_LOG.md with final status
- Add contributing guidelines
- Add license file
- Create changelog
- Remove any temporary files or debug code
- Final code review and cleanup
- Tag release version v1.0.0

**Why:** Finalizes all documentation and prepares the project for public release or handoff.

---

## Summary

- **Total PRs:** 39 (up from 28 due to TDD approach)
- **Estimated Timeline:** 10-14 weeks (due to proper TDD implementation)
- **TDD Impact:** Tests are now written BEFORE implementation for every feature
- **Key Milestones:**
  - Phase 1 complete: Foundation & testing setup
  - Phase 2 complete: Basic canvas functionality (with tests)
  - Phase 3 complete: Real-time collaboration working (with tests)
  - Phase 4 complete: Backend & persistence (with tests)
  - Phase 5 complete: Authentication (with tests)
  - Phase 6 complete: AI assistant functional (with tests)
  - Phase 7 complete: Performance & security hardened
  - Phase 8 complete: Production deployment
  - Phase 9 complete: v1.0.0 release

## Notes

- **TDD WORKFLOW:** For each feature, follow this exact order:
  1. Write tests (PR with "Tests" in title)
  2. Run tests - they should FAIL
  3. Implement feature (PR with "Implementation" in title)
  4. Run tests - they should PASS
  5. Do NOT modify tests to make them pass (unless tests were incorrect)
- Each PR should be reviewed and tested before merging
- Update AI_LOG.md for all AI-related interactions
- Maintain test coverage above 80%
- Keep PRs focused and atomic for easier review
- Tests ensure quality and catch regressions early

