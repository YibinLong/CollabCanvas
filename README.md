# CollabCanvas - Figma Clone

> A real-time collaborative design tool inspired by Figma.

CollabCanvas allows multiple users to create and edit vector shapes together in real-time, with each user's cursor visible to others. Built with modern web technologies, it features persistent storage, authentication, and advanced editing tools like keyboard shortcuts and shape alignment.

## ✨ Features

- 🎨 **Vector Canvas** - Draw rectangles, circles, lines, and text
- 🤝 **Real-Time Collaboration** - See other users' cursors and edits instantly
- 🔐 **Authentication** - Secure login with Supabase Auth
- 💾 **Persistent Storage** - Documents saved to PostgreSQL with version history
- ⚡ **Low Latency** - Sub-100ms sync using Yjs CRDTs
- ⌨️ **Keyboard Shortcuts** - Arrow keys, copy/paste (Cmd+C/V), duplicate (Cmd+D)
- 📐 **Alignment Tools** - Align and distribute shapes like a pro
- 🔒 **Conflict Resolution** - Smart shape locking prevents edit conflicts

## 🏗️ Project Structure

```text
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
│   ├── testing/          # Testing documentation
│   ├── deployment/       # Deployment guides
│   ├── status-reports/   # Progress reports
│   ├── pr-completions/   # PR completion reports
│   └── archive/          # Historical documents
│
├── scripts/          # Utility scripts
│   ├── START_TESTING.sh  # Run test suites
│   └── DEPLOY_NOW.sh     # Deployment script
│
├── PRD.md            # Product Requirements Document
├── TASK_LIST.md      # Development roadmap (44 PRs total)
└── README.md         # This file
```

## 🚀 Quick Start

### Prerequisites

- **Node.js** 18+ and npm
- **PostgreSQL** database (or use Supabase)
- **Supabase account** (for auth and database)
- **OpenAI API key** (optional, only needed for Phase 7 AI features)

### 1. Clone Repository

```bash
git clone <your-repo-url>
cd Figma_Clone
```

### 2. Set Up Frontend

```bash
cd frontend
npm install
# Create .env.local with your values (see Environment Variables section below)
npm run dev
```

Frontend runs on **http://localhost:3000**

### 3. Set Up Backend

```bash
cd backend
npm install
# Create .env with your values (see Environment Variables section below)
npm run dev
```

Backend runs on **http://localhost:4000**

See [Setup Database Guide](./docs/guides/SETUP_DATABASE.md) and [Quick Start Guide](./docs/guides/QUICK_START.md) for detailed instructions.

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
- **Supabase** - Authentication
- **OpenAI API** - AI command interpretation (Phase 7, pending)

### Infrastructure

- **Vercel** - Frontend hosting
- **Render** - Backend hosting
- **Supabase** - Database and auth hosting

## 🔒 Collaborative Editing Lock Strategy

**WHY:** When multiple users edit the same shape simultaneously, conflicts can occur. Our lock strategy prevents this by ensuring only one user can modify a shape at a time.

### How It Works

1. **Lock Acquisition**
   - When a user clicks to move or resize a shape, it's immediately locked with their user ID
   - Other users cannot modify the locked shape until it's released
   - The lock is timestamped to detect stale locks

2. **Visual Feedback**
   - **Red dashed border** appears around locked shapes
   - **Lock icon (🔒)** displays above locked shapes
   - Resize handles are hidden for shapes locked by others
   - Console messages inform users when interactions are blocked

3. **Automatic Lock Release**
   - Locks release immediately when the user finishes their action (mouse up)
   - **30-second timeout:** Stale locks auto-release if a user's browser crashes
   - **5-second check interval:** System scans for and releases expired locks

4. **Data Structure**

   ```typescript
   interface Shape {
     // ... other properties
     lockedBy?: string | null;  // User ID of current editor
     lockedAt?: number | null;   // Timestamp for timeout detection
   }
   ```

### User Experience

**User A (has the lock):**

- Clicks and drags a shape → shape locks immediately
- Can move/resize freely
- Lock releases on mouse up

**User B (trying to edit the same shape):**

- Sees red dashed border with lock icon
- Click/drag is blocked with a console message
- Must wait for User A to finish or for the 30s timeout

**Benefits:**

- ✅ Prevents conflicting edits and data corruption
- ✅ Clear visual indicators show who's editing what
- ✅ Automatic recovery from browser crashes via timeout
- ✅ Lock state syncs in real-time via Yjs CRDT
- ✅ Users can still select locked shapes (just can't modify them)

For detailed implementation and testing instructions, see [Conflict Resolution Documentation](./docs/CONFLICT_RESOLUTION.md).

## 📖 Documentation

### Essential Docs

- **[PRD.md](./PRD.md)** - Complete product requirements
- **[TASK_LIST.md](./TASK_LIST.md)** - Development roadmap (Phases 1-6 complete)
- **[Documentation Index](./docs/INDEX.md)** - Complete documentation map
- **[START_HERE.md](./docs/guides/START_HERE.md)** - New user setup guide

### Quick Links

- **[Quick Start Guide](./docs/guides/QUICK_START.md)** - Get up and running fast
- **[Setup Database](./docs/guides/SETUP_DATABASE.md)** - Database configuration
- **[Troubleshooting](./docs/guides/TROUBLESHOOTING.md)** - Common issues and fixes
- **[Testing Guide](./docs/guides/TESTING_GUIDE.md)** - How to test the project
- **[TDD Workflow](./docs/guides/TDD_WORKFLOW.md)** - Test-driven development approach
- **[Deployment Guide](./docs/deployment/DEPLOYMENT_GUIDE.md)** - How to deploy

### Component Docs

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

See [TASK_LIST.md](./TASK_LIST.md) for the complete development roadmap.

## 📋 Current Status

**✅ Phases 1-6 Complete!**

- ✅ **Phase 1:** Foundation & Testing Infrastructure
- ✅ **Phase 2:** Core Canvas (shapes, selection, manipulation)
- ✅ **Phase 3:** Real-Time Collaboration (Yjs sync, cursors, presence)
- ✅ **Phase 4:** Backend & Persistence (PostgreSQL, Prisma, document API)
- ✅ **Phase 5:** Authentication (Supabase Auth, JWT, protected routes)
- ✅ **Phase 6:** Advanced Canvas Features (keyboard shortcuts, alignment tools)
- 🔄 **Phase 7:** AI Integration (Pending)

**Test Results:** 213 tests passing ✅

- Frontend: 135 tests
- Backend: 78 tests

**✨ Key Features Working:**

- Real-time collaboration with multiple users
- Document persistence and version history
- User authentication and protected routes
- Arrow keys, copy/paste (Cmd+C/V), duplicate (Cmd+D)
- Shape alignment and distribution tools
- Conflict resolution with shape locking

**Next Up: AI Assistant (Phase 7)**

- OpenAI integration for natural language commands
- "Create a 3x3 grid of circles" type commands

See [TASK_LIST.md](./TASK_LIST.md) for complete roadmap.

## 🤝 Contributing

This project is being built PR by PR following the task list. Each PR is:

- Small and focused
- Well-tested
- Documented

See [TASK_LIST.md](./TASK_LIST.md) for what's coming next.

## 📝 Environment Variables

### Frontend (.env.local)

Create `frontend/.env.local` with:

```env
NEXT_PUBLIC_API_URL=http://localhost:4000
NEXT_PUBLIC_BACKEND_URL=http://localhost:4000
NEXT_PUBLIC_WS_URL=ws://localhost:4001
NEXT_PUBLIC_SUPABASE_URL=https://xxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
```

### Backend (.env)

Create `backend/.env` with:

```env
PORT=4000
DATABASE_URL=postgresql://user:pass@localhost:5432/collabcanvas
SUPABASE_URL=https://xxx.supabase.co
SUPABASE_SERVICE_KEY=your_service_key
# OPENAI_API_KEY=sk-your-key  # Only needed for Phase 7 (AI features)
```

**⚠️ Never commit .env files to Git!**

See [Setup Database Guide](./docs/guides/SETUP_DATABASE.md) for database configuration.

## 📚 Complete Documentation Map

All project documentation is organized in the [`docs/`](./docs) folder:

### 📂 Directory Structure

- **[docs/architecture/](./docs/architecture/)** - System design and structure
- **[docs/guides/](./docs/guides/)** - Setup instructions and workflows
- **[docs/testing/](./docs/testing/)** - Testing documentation
- **[docs/deployment/](./docs/deployment/)** - Deployment guides
- **[docs/status-reports/](./docs/status-reports/)** - Progress and completion reports
- **[docs/pr-completions/](./docs/pr-completions/)** - Detailed PR documentation

### 🔧 Scripts

- **[scripts/START_TESTING.sh](./scripts/START_TESTING.sh)** - Run test suites
- **[scripts/DEPLOY_NOW.sh](./scripts/DEPLOY_NOW.sh)** - Deployment automation

**📋 See [Documentation Index](./docs/INDEX.md) for a complete guide to all documentation.**

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
5. See [Troubleshooting](./docs/guides/TROUBLESHOOTING.md) for common issues

---

Built with ❤️ using TDD principles
