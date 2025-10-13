# CollabCanvas - Figma Clone

> A real-time collaborative design tool with AI assistance, inspired by Figma.

CollabCanvas allows multiple users to create and edit vector shapes together in real-time, with each user's cursor visible to others. An AI assistant can manipulate the canvas using natural language commands like "create a 3x3 grid of buttons."

## ✨ Features

- 🎨 **Vector Canvas** - Draw rectangles, circles, lines, and text
- 🤝 **Real-Time Collaboration** - See other users' cursors and edits instantly
- 🤖 **AI Assistant** - Create and arrange shapes with natural language
- 🔐 **Authentication** - Secure login with Supabase Auth
- 💾 **Persistent Storage** - Documents saved to PostgreSQL
- ⚡ **Low Latency** - Sub-100ms sync using Yjs CRDTs

## 🏗️ Project Structure

```
Figma_Clone/
├── frontend/          # Next.js React app
│   ├── app/          # Pages and layouts
│   ├── components/   # React components
│   ├── hooks/        # Custom hooks
│   ├── lib/          # Utilities
│   └── types/        # TypeScript types
│
├── backend/          # Node.js Express server
│   └── src/
│       ├── routes/       # API endpoints
│       ├── controllers/  # Business logic
│       ├── services/     # External integrations
│       ├── middleware/   # Request interceptors
│       └── types/        # TypeScript types
│
├── docs/             # All project documentation
│   ├── architecture/     # System design docs
│   ├── guides/           # Setup and workflow guides
│   ├── pr-completions/   # PR completion reports
│   └── archive/          # Historical documents
│
├── PRD.md            # Product Requirements Document
├── TASK_LIST.md      # Development roadmap (39 PRs)
└── README.md         # This file
```

## 🚀 Quick Start

### Prerequisites

- **Node.js** 18+ and npm
- **PostgreSQL** database (or use Supabase)
- **Supabase account** (for auth and database)
- **OpenAI API key** (for AI features)

### 1. Clone Repository

```bash
git clone <your-repo-url>
cd Figma_Clone
```

### 2. Set Up Frontend

```bash
cd frontend
npm install
cp .env.example .env.local
# Edit .env.local with your values
npm run dev
```

Frontend runs on **http://localhost:3000**

### 3. Set Up Backend

```bash
cd backend
npm install
cp .env.example .env
# Edit .env with your values
npm run dev
```

Backend runs on **http://localhost:4000**

See [Frontend README](./frontend/README.md) and [Backend README](./backend/README.md) for detailed setup instructions.

## 🛠️ Tech Stack

### Frontend
- **Next.js** - React framework with SSR
- **TypeScript** - Type-safe JavaScript
- **Zustand** - State management
- **Yjs** - Real-time collaboration (CRDT)
- **TailwindCSS** - Utility-first CSS
- **Supabase JS** - Auth client

### Backend
- **Node.js + Express** - REST API server
- **TypeScript** - Type-safe JavaScript
- **Yjs + y-websocket** - Real-time sync server
- **Prisma** - Database ORM
- **PostgreSQL** - Relational database
- **OpenAI API** - AI command interpretation
- **Supabase** - Authentication

### Infrastructure
- **Vercel** - Frontend hosting
- **Render** - Backend hosting
- **Supabase** - Database and auth hosting

## 📖 Documentation

- **[PRD.md](./PRD.md)** - Complete product requirements
- **[TASK_LIST.md](./TASK_LIST.md)** - 39 PRs from setup to production
- **[TDD_WORKFLOW.md](./TDD_WORKFLOW.md)** - Test-driven development approach
- **[Frontend README](./frontend/README.md)** - Frontend details
- **[Backend README](./backend/README.md)** - Backend details

## 🧪 Development Approach

This project follows **Test-Driven Development (TDD)**:

1. ✍️ Write failing tests first
2. ✅ Implement code to pass tests
3. ♻️ Refactor while keeping tests green

Each feature is split into:
- **Test PR** - Write tests that define expected behavior
- **Implementation PR** - Write code to make tests pass

See [TASK_LIST.md](./TASK_LIST.md) for the complete 39-PR roadmap.

## 📋 Current Status

**✅ PR #1: Project Setup Complete**

- [x] Frontend Next.js project initialized
- [x] Backend Node.js/Express project initialized
- [x] TypeScript configured
- [x] Folder structure created
- [x] All dependencies listed in package.json
- [x] README documentation written

**⏭️ Next Steps:**
- PR #2: Database schema with Prisma
- PR #3: Testing infrastructure setup
- PR #4-5: Basic canvas with TDD

## 🤝 Contributing

This project is being built PR by PR following the task list. Each PR is:
- Small and focused
- Well-tested
- Documented

See [TASK_LIST.md](./TASK_LIST.md) for what's coming next.

## 📝 Environment Variables

### Frontend (.env.local)
```
NEXT_PUBLIC_API_URL=http://localhost:4000
NEXT_PUBLIC_WS_URL=ws://localhost:4001
NEXT_PUBLIC_SUPABASE_URL=https://xxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_key
```

### Backend (.env)
```
PORT=4000
DATABASE_URL=postgresql://user:pass@localhost:5432/collabcanvas
SUPABASE_URL=https://xxx.supabase.co
SUPABASE_SERVICE_KEY=your_key
OPENAI_API_KEY=sk-your-key
```

**⚠️ Never commit .env files to Git!**

## 📚 Documentation

All project documentation is organized in the [`docs/`](./docs) folder:

- **[Architecture](./docs/architecture/)** - System design and structure
- **[Guides](./docs/guides/)** - Setup instructions and workflows
- **[PR Completions](./docs/pr-completions/)** - Completion reports for each PR
- **[Documentation Standard](./docs/PR_DOCUMENTATION_STANDARD.md)** - How to document PRs

**Key Documents:**
- [Product Requirements](./PRD.md) - Feature specifications
- [Task List](./TASK_LIST.md) - Complete development roadmap
- [Setup Guide](./docs/guides/SETUP_GUIDE.md) - Initial project setup
- [TDD Workflow](./docs/guides/TDD_WORKFLOW.md) - Testing approach

## 🎯 Design Philosophy

**For Beginners:**
Every code file includes comments explaining:
- **WHY** we're doing something
- **WHAT** each piece of code does
- **HOW** it fits into the larger system

This makes the codebase a learning resource, not just a product.

## 📄 License

MIT License - See LICENSE file for details

## 🙋 Need Help?

1. Check the [PRD](./PRD.md) for feature specifications
2. Read component README files for architectural decisions
3. Look at inline code comments for implementation details
4. Review [TASK_LIST.md](./TASK_LIST.md) to see what's coming next

---

Built with ❤️ using TDD principles

