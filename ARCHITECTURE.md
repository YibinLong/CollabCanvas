# CollabCanvas Architecture Overview

This document explains how all the pieces fit together.

## 🏗️ System Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                          USER'S BROWSER                          │
│                                                                   │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │               Next.js Frontend (Port 3000)                │  │
│  │                                                            │  │
│  │  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐   │  │
│  │  │    Canvas    │  │  Toolbar     │  │  Properties  │   │  │
│  │  │  Component   │  │  Component   │  │    Panel     │   │  │
│  │  └──────────────┘  └──────────────┘  └──────────────┘   │  │
│  │                                                            │  │
│  │  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐   │  │
│  │  │   Zustand    │  │   Yjs Doc    │  │  AI Panel    │   │  │
│  │  │    Store     │  │   (Local)    │  │              │   │  │
│  │  └──────────────┘  └──────────────┘  └──────────────┘   │  │
│  └──────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────┘
                              │
                              │ HTTP (REST API)
                              │ WebSocket (Real-time)
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                      BACKEND SERVER (Render)                     │
│                                                                   │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │            Express Server (Port 4000)                     │  │
│  │                                                            │  │
│  │  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐   │  │
│  │  │   Routes     │  │ Controllers  │  │  Services    │   │  │
│  │  │              │  │              │  │              │   │  │
│  │  │ /documents   │─▶│ Document     │─▶│ Prisma       │   │  │
│  │  │ /ai          │  │ AI           │  │ OpenAI       │   │  │
│  │  │ /auth        │  │ Auth         │  │ Supabase     │   │  │
│  │  └──────────────┘  └──────────────┘  └──────────────┘   │  │
│  └──────────────────────────────────────────────────────────┘  │
│                                                                   │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │          y-websocket Server (Port 4001)                   │  │
│  │                                                            │  │
│  │     Manages document rooms and broadcasts Yjs updates     │  │
│  └──────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────┘
                              │
                              │
                    ┌─────────┴──────────┐
                    │                    │
                    ▼                    ▼
         ┌────────────────┐   ┌────────────────┐
         │   PostgreSQL   │   │   OpenAI API   │
         │   (Supabase)   │   │                │
         │                │   │  GPT-4 for     │
         │  - Documents   │   │  AI commands   │
         │  - Users       │   │                │
         │  - Versions    │   └────────────────┘
         └────────────────┘
```

## 🔄 Data Flow

### 1. User Draws a Shape

```
User clicks canvas
       ↓
Canvas component creates shape
       ↓
Zustand store updated (local state)
       ↓
Yjs document updated (CRDT)
       ↓
Yjs sends update via WebSocket
       ↓
Backend y-websocket server
       ↓
Broadcasts to all connected clients
       ↓
Other users see the shape instantly
```

### 2. User Saves Document

```
User clicks "Save"
       ↓
Frontend calls POST /api/documents
       ↓
Backend documentController
       ↓
Serialize Yjs document state
       ↓
Prisma saves to PostgreSQL
       ↓
Return success response
       ↓
Frontend shows "Saved!" message
```

### 3. AI Creates Shapes

```
User types "create a red button"
       ↓
Frontend calls POST /api/ai/interpret
       ↓
Backend aiController
       ↓
OpenAI API interprets prompt
       ↓
Returns structured operations
       ↓
Backend applies to Yjs document
       ↓
Broadcasts via WebSocket
       ↓
All users see new shapes
```

## 📦 Component Architecture (Frontend)

### React Component Hierarchy

```
<RootLayout>
  │
  ├── <AuthProvider>            # Manages user authentication state
  │     │
  │     ├── <DocumentPage>      # Main canvas page
  │     │     │
  │     │     ├── <Toolbar>
  │     │     │     ├── <ToolButton> (Select)
  │     │     │     ├── <ToolButton> (Rectangle)
  │     │     │     ├── <ToolButton> (Circle)
  │     │     │     └── <ToolButton> (AI Assistant)
  │     │     │
  │     │     ├── <Canvas>
  │     │     │     ├── <Grid>
  │     │     │     ├── <Shape> (for each shape)
  │     │     │     ├── <SelectionBox>
  │     │     │     └── <CursorOverlay>
  │     │     │
  │     │     ├── <PropertiesPanel>
  │     │     │     ├── <ColorPicker>
  │     │     │     ├── <SizeInput>
  │     │     │     └── <RotationInput>
  │     │     │
  │     │     ├── <PresenceList>
  │     │     │     └── <UserAvatar> (for each user)
  │     │     │
  │     │     └── <AIPanel>
  │     │           ├── <ChatInput>
  │     │           └── <MessageList>
  │     │
  │     └── <LoginPage>
  │           ├── <LoginForm>
  │           └── <SignupForm>
```

## 🔌 Backend Architecture

### Request Flow

```
HTTP Request
    ↓
Express Server
    ↓
Middleware Stack:
  1. Helmet (security headers)
  2. CORS (allow frontend origin)
  3. Body Parser (parse JSON)
  4. Auth Middleware (verify JWT)
  5. Rate Limiter (prevent abuse)
    ↓
Route Handler
    ↓
Controller Function
    ↓
Service Layer (if needed)
    ↓
Database/External API
    ↓
Response
```

### Folder Organization

```
src/
├── server.ts              # Entry point, middleware setup
│
├── routes/                # Define URL paths
│   ├── documents.ts       # router.get('/documents', ...)
│   ├── ai.ts              # router.post('/ai/interpret', ...)
│   └── auth.ts
│
├── controllers/           # Handle business logic
│   ├── documentController.ts    # getDocuments(), createDocument()
│   ├── aiController.ts          # interpretPrompt()
│   └── authController.ts        # verifyToken()
│
├── services/              # External integrations
│   ├── yjsService.ts            # serialize/deserialize Yjs docs
│   ├── openaiService.ts         # call OpenAI API
│   ├── supabaseService.ts       # Supabase client
│   └── prismaService.ts         # Database client
│
├── middleware/            # Interceptors
│   ├── auth.ts                  # JWT validation
│   ├── validate.ts              # Input sanitization
│   └── rateLimit.ts             # Rate limiting
│
└── types/                 # TypeScript definitions
    └── index.ts
```

## 🧠 State Management (Frontend)

### Three Layers of State

1. **Local Component State** (useState)
   - Temporary UI state (modal open/closed, hover effects)
   - Doesn't need to be shared

2. **Zustand Store** (Global State)
   - Canvas viewport (pan, zoom)
   - Selected shape IDs
   - Current tool
   - Syncs with Yjs but also has local-only concerns

3. **Yjs Document** (Shared State)
   - All shapes and their properties
   - Synchronized across all users
   - Persisted to database
   - CRDT ensures conflict-free merges

### State Sync Flow

```
User action
    ↓
Update Zustand store ←───┐
    ↓                     │
Update Yjs document       │
    ↓                     │
WebSocket broadcast       │
    ↓                     │
Other clients receive     │
    ↓                     │
Their Yjs docs update     │
    ↓                     │
Observer triggers ────────┘
    ↓
Their Zustand stores update
    ↓
React re-renders
```

## 🔐 Authentication Flow

```
User enters email/password
    ↓
Frontend calls Supabase Auth
    ↓
Supabase validates credentials
    ↓
Returns JWT token + user data
    ↓
Frontend stores in AuthContext
    ↓
Attaches JWT to all API requests
    ↓
Backend middleware verifies JWT
    ↓
Extracts user ID from token
    ↓
Passes to controller (req.user)
```

## 🤖 AI Integration

### Command Processing Pipeline

```
1. User Input
   "Create a red button that says 'Click me'"

2. Frontend
   POST /api/ai/interpret { prompt: "..." }

3. Backend aiController
   - Rate limit check
   - Call OpenAI with function schemas

4. OpenAI API
   - Interprets natural language
   - Returns structured function call:
     {
       type: "createShape",
       args: {
         type: "rect",
         x: 100, y: 100,
         width: 120, height: 40,
         color: "#ff0000",
         text: "Click me"
       }
     }

5. Backend
   - Validates operation
   - Applies to Yjs document
   - Broadcasts via WebSocket

6. All Clients
   - Receive update
   - Render new shape
   - Show "AI created: Button" notification
```

## 🗄️ Database Schema (Prisma)

```prisma
model Document {
  id        String   @id @default(uuid())
  title     String
  ownerId   String
  yjsState  Bytes?   // Serialized Yjs document
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
  
  versions  DocumentVersion[]
}

model DocumentVersion {
  id         String   @id @default(uuid())
  documentId String
  snapshot   Bytes    // Point-in-time Yjs state
  createdAt  DateTime @default(now())
  
  document   Document @relation(fields: [documentId], references: [id])
}
```

## 🚀 Deployment Architecture

### Development (Local)

```
localhost:3000 (Frontend)
       ↓
localhost:4000 (Backend REST)
localhost:4001 (Backend WebSocket)
       ↓
localhost:5432 (PostgreSQL)
```

### Production

```
your-app.vercel.app (Frontend on Vercel)
       ↓
your-backend.onrender.com (Backend on Render)
       ↓
your-project.supabase.co (PostgreSQL + Auth)
       ↓
api.openai.com (OpenAI API)
```

## 🎯 Key Design Decisions

### Why Yjs?
- **CRDTs** ensure conflict-free merges
- **Battle-tested** for real-time collaboration
- **Efficient** binary encoding for network transfer

### Why Zustand?
- **Simple** API, no boilerplate
- **Fast** re-renders with fine-grained selectors
- **Small** bundle size (3KB)

### Why Next.js?
- **Server-side rendering** for fast initial load
- **API routes** for serverless functions
- **File-based routing** for easy navigation

### Why Prisma?
- **Type-safe** queries (TypeScript integration)
- **Migrations** for schema versioning
- **Works with** multiple databases

### Why SVG for rendering?
- **Vector graphics** scale without pixelation
- **DOM-based** so we can use React easily
- **Good enough** for MVP (can switch to Canvas later)

## 🔄 Real-Time Sync Explained

### The Challenge
Multiple users editing the same document simultaneously can cause conflicts.

### The Solution: CRDTs (Yjs)

**Traditional approach (broken):**
```
User A: Set shape color to red
User B: Set shape color to blue
       ↓
Last write wins (data loss!)
```

**CRDT approach (Yjs):**
```
User A: Operation A at timestamp T1
User B: Operation B at timestamp T2
       ↓
Yjs merges both operations deterministically
       ↓
All users converge to same state
```

### How Yjs Works

1. **Documents are composed of types:**
   - Y.Map (key-value pairs)
   - Y.Array (lists)
   - Y.Text (collaborative text)

2. **Every change creates an update:**
   - Binary encoded
   - Contains operation + metadata
   - Small (typically <100 bytes)

3. **Updates are broadcast:**
   - Via WebSocket to all clients
   - Clients apply update to their local doc
   - Converges automatically

4. **Persistence:**
   - Serialize entire document state
   - Save to database as binary blob
   - Load on reconnect

## 📚 Further Reading

- [Yjs Documentation](https://docs.yjs.dev/)
- [Next.js Docs](https://nextjs.org/docs)
- [Prisma Docs](https://www.prisma.io/docs)
- [Zustand Docs](https://github.com/pmndrs/zustand)
- [OpenAI Function Calling](https://platform.openai.com/docs/guides/function-calling)

---

This architecture is designed to be:
- **Scalable** - Add more users, documents, and features
- **Maintainable** - Clear separation of concerns
- **Testable** - Each layer can be tested independently
- **Beginner-friendly** - Well-documented with clear patterns

