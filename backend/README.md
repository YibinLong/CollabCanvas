# CollabCanvas Backend

The backend is a **Node.js** server built with **Express** and **TypeScript**. It provides REST API endpoints and a WebSocket server for real-time collaboration.

## 🎯 What This Does

- **REST API** - Endpoints for documents, authentication, and AI commands
- **WebSocket Server** - Real-time synchronization using Yjs and y-websocket
- **Database** - PostgreSQL via Prisma ORM for persistent storage
- **AI Integration** - OpenAI API for natural language commands
- **Authentication** - JWT validation with Supabase Auth

## 📁 Folder Structure

```
backend/
├── src/
│   ├── server.ts          # Main entry point
│   │
│   ├── routes/            # API endpoints
│   │   ├── documents.ts   # Document CRUD
│   │   ├── ai.ts          # AI commands
│   │   └── auth.ts        # Auth helpers
│   │
│   ├── controllers/       # Business logic
│   │   ├── documentController.ts
│   │   ├── aiController.ts
│   │   └── authController.ts
│   │
│   ├── services/          # External integrations
│   │   ├── yjsService.ts       # Yjs serialization
│   │   ├── openaiService.ts    # OpenAI API calls
│   │   ├── supabaseService.ts  # Supabase client
│   │   └── prismaService.ts    # Database client
│   │
│   ├── middleware/        # Request interceptors
│   │   ├── auth.ts        # JWT verification
│   │   ├── validate.ts    # Input validation
│   │   └── rateLimit.ts   # Rate limiting
│   │
│   └── types/             # TypeScript types
│       └── index.ts       # Shared type definitions
│
├── prisma/                # Database schema
│   └── schema.prisma      # Prisma models (added in PR #2)
│
└── package.json           # Dependencies and scripts
```

## 🚀 Getting Started

### 1. Install Dependencies

```bash
cd backend
npm install
```

### 2. Set Up Environment Variables

Copy `.env.example` to `.env` and fill in your values:

```bash
cp .env.example .env
```

Edit `.env`:
```
PORT=4000
DATABASE_URL=postgresql://user:password@localhost:5432/collabcanvas
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_KEY=your-service-key
OPENAI_API_KEY=sk-your-key
```

### 3. Run Development Server

```bash
npm run dev
```

Server runs on [http://localhost:4000](http://localhost:4000).

## 📡 API Endpoints

### Health Check
```
GET /health
```
Returns server status and uptime.

### Documents (Coming in PR #16-17)
```
GET    /api/documents         # List all documents
POST   /api/documents         # Create new document
GET    /api/documents/:id     # Get document by ID
PUT    /api/documents/:id     # Update document
DELETE /api/documents/:id     # Delete document
```

### AI Commands (Coming in PR #24-27)
```
POST   /api/ai/interpret      # Send prompt, get operations
```

## 📦 Key Dependencies

| Package | Purpose |
|---------|---------|
| `express` | Web server framework |
| `yjs` | CRDT for real-time collaboration |
| `y-websocket` | WebSocket server for Yjs |
| `@prisma/client` | Type-safe database client |
| `openai` | OpenAI API client |
| `@supabase/supabase-js` | Authentication client |
| `helmet` | Security headers |
| `cors` | Cross-origin resource sharing |

## 🗄️ Database

Uses **PostgreSQL** with **Prisma ORM**. Schema and migrations will be added in PR #2.

## 🧪 Testing

Run tests with:

```bash
npm test
```

Tests use **Jest** and **ts-jest**.

## 📝 Scripts

```bash
npm run dev      # Start development server (with auto-reload)
npm run build    # Compile TypeScript to JavaScript
npm start        # Start production server
npm run lint     # Run ESLint
npm run format   # Format code with Prettier
npm test         # Run tests
```

## 🔒 Security

- **Helmet** - Sets security headers
- **CORS** - Restricts origins to frontend URL only
- **Rate limiting** - Prevents API abuse (added in PR #31)
- **JWT validation** - Protects routes (added in PR #21-23)

## 🔗 Related

- [Frontend README](../frontend/README.md)
- [PRD](../PRD.md)
- [Task List](../TASK_LIST.md)

