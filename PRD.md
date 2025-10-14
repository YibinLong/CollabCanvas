# Product Requirements Document — CollabCanvas (Figma Clone)

## Project Overview

CollabCanvas is a real-time collaborative design tool inspired by Figma. Users can draw, move, resize, and edit vector shapes and text while collaborating live with others. Each user’s cursor and presence are visible in real time, and changes sync instantly for all participants. The system also includes an AI design assistant that can manipulate the canvas using natural language (e.g., “create a 3x3 grid of buttons”).

Target users: designers, students, and small teams who want lightweight, multiplayer visual collaboration with AI-assisted features.
Core value: low-latency collaboration with an AI co-designer that performs precise canvas operations shared by all connected users.

---

## Technology Recommendations

Frontend

* Next.js (React + TypeScript)
* Zustand for state management
* Yjs for real-time collaboration (client-side)
* TailwindCSS for styling
* SVG-based rendering for MVP shapes (rectangles, circles, text)
* Built-in Next.js compiler for builds

Backend

* Node.js + TypeScript
* Express for REST endpoints
* y-websocket for the real-time collaboration server
* PostgreSQL for persistent data storage
* Prisma ORM for schema management and migrations
* OpenAI API integration for AI agent commands
* Supabase Auth for user authentication

Infrastructure

* Frontend hosting: Vercel
* Backend hosting: Render
* Database hosting: Supabase

Testing & Dev Tools

* Jest + React Testing Library
* ESLint + Prettier
* npm
* GitHub for version control and commits

---

## System Architecture

The system consists of a frontend (Next.js app) that renders the collaborative SVG canvas and connects to a backend running on Render. The backend exposes REST endpoints for documents and AI commands, and a y-websocket server for real-time synchronization of Yjs documents. Supabase handles both PostgreSQL storage and user authentication. The OpenAI API is called from the backend to interpret user prompts into structured function calls (create, move, resize, arrange, etc.) which are then applied to the shared Yjs document and broadcast to all connected clients.

---

## Detailed Requirements

### Canvas Core

* Pan and zoom with smooth interactions
* Create, move, resize, and rotate shapes (rectangles, circles, lines, and text)
* Multi-selection, locking, and layer reordering
* Visual handles for resize and rotation
* Basic alignment and distribution controls
* Keyboard shortcuts (e.g., space+drag to pan)

### Real-Time Collaboration

* Multiplayer cursors with user names and distinct colors
* Presence list showing connected users
* Shared Yjs document for canvas state
* Locking system to prevent conflicting edits
* Sync latency under 100ms
* Snapshot persistence to PostgreSQL every few seconds or on disconnect

### AI Agent

* Backend endpoint `/api/ai/interpret` receives user prompts
* Uses OpenAI function-calling to produce structured operations
* Supported commands: createShape, moveShape, resizeShape, rotateShape, createText, arrangeShapes, groupShapes
* Each command modifies the shared Yjs document
* Actions are broadcast so all users see the AI’s changes in real time

### Persistence & History

* Store serialized Yjs documents in PostgreSQL via Prisma
* Periodic snapshots for version history (e.g., last 50 versions)
* Document metadata (title, owner, updated_at)

### Authentication

* Supabase Auth for signup, login, and session management
* JWT-based authentication passed in headers to backend
* Presence awareness tied to authenticated user identity

### Security

* All API keys and secrets stored in server environment variables
* Rate limiting on AI and WebSocket connections
* CORS restricted to known frontend origin

### Performance Targets

* 60 FPS on canvas interactions
* Sync latency <100ms between users
* Handle 500+ simple objects without major frame drops

---

## API / Function Schema (AI)

Example TypeScript interfaces:

```ts
type ShapeType = 'rect' | 'circle' | 'line' | 'text';

interface CreateShapeArgs {
  type: ShapeType;
  x: number;
  y: number;
  width?: number;
  height?: number;
  rotation?: number;
  color?: string;
  text?: string;
  fontSize?: number;
  id?: string;
}

interface MoveShapeArgs { shapeId: string; x: number; y: number; }
interface ResizeShapeArgs { shapeId: string; width: number; height: number; }
interface RotateShapeArgs { shapeId: string; degrees: number; }

interface ArrangeArgs {
  shapeIds: string[];
  mode: 'horizontal' | 'vertical' | 'grid';
  cols?: number;
  spacing?: number;
}
```

Backend applies these operations directly to the Yjs document and persists the updated snapshot.

---

## .env Setup

Example `.env` file:

```
NEXT_PUBLIC_API_URL=https://api.example.com
NEXT_PUBLIC_WS_URL=wss://ws.example.com
DATABASE_URL=postgres://user:password@host:5432/collabcanvas
SUPABASE_URL=https://your-supabase-url.supabase.co
SUPABASE_ANON_KEY=your_anon_key_here
SUPABASE_SERVICE_KEY=your_service_role_key_here
OPENAI_API_KEY=sk-xxxxx
JWT_SECRET=replace_with_random_secret
PORT=4000
```

* NEXT_PUBLIC_API_URL and NEXT_PUBLIC_WS_URL: URLs to backend on Render
* DATABASE_URL: PostgreSQL connection string from Supabase
* SUPABASE_*: generated in Supabase project settings
* OPENAI_API_KEY: from OpenAI dashboard (keep server-side only)
* JWT_SECRET: generate via `openssl rand -hex 32`

Do not commit `.env` files to Git.

---

## Testing & QA Plan (TDD)

All code should be implemented using a Test-Driven Development approach:

1. Write failing test describing expected behavior
2. Implement code until test passes
3. Do not modify tests to make them pass unless they were incorrect

Testing setup:

* Jest for unit and integration tests
* React Testing Library for component testing

Example unit test for sync:

```ts
test('shape created by one client syncs to another', async () => {
  const clientA = await connectClient();
  const clientB = await connectClient();
  const received: any[] = [];
  clientB.on('shape:created', s => received.push(s));
  await clientA.createShape({ type: 'rect', x: 10, y: 10, width: 100, height: 50 });
  await new Promise(r => setTimeout(r, 100));
  expect(received.length).toBe(1);
});
```

---

## Debugging Guidelines

* Use structured logging (JSON) on the backend
* Use `DEBUG=true` flag in the frontend to enable verbose logs
* Log WebSocket connection events and Yjs update sizes
* Log AI function calls with trace IDs
* Use Supabase dashboard to monitor authentication and DB activity
* Add health endpoints `/health` and `/metrics` to backend

---

## External Setup Instructions

Manual setup required:

1. Create a Supabase project
2. Enable Auth and Database
3. Copy Supabase URL, anon key, and service key into `.env`
4. Deploy backend to Render

   * Build command: `npm install && npm run build`
   * Start command: `node dist/server.js`
   * Add all `.env` vars in Render dashboard
5. Deploy frontend to Vercel

   * Set `NEXT_PUBLIC_API_URL` and `NEXT_PUBLIC_WS_URL` to your backend URLs
6. Test local and production setups for connectivity

---

## CORS Configuration

Express configuration:

```ts
import cors from 'cors';
app.use(cors({
  origin: ['https://your-frontend.vercel.app', 'http://localhost:3000'],
  credentials: true
}));
```

This ensures that the frontend can talk to the backend from both local and production environments.

---

## Deployment Plan

Production:

* Frontend → deploy to Vercel
* Backend → deploy to Render
* Database and Auth → handled by Supabase
* Update `.env` with production URLs

---

## Summary

* Frontend: Next.js (React + TypeScript) with SVG rendering, Zustand, TailwindCSS, and Yjs
* Backend: Node.js (TypeScript), Express, y-websocket, Prisma, PostgreSQL (Supabase), OpenAI integration, Supabase Auth
* Infra: Vercel for frontend, Render for backend, Supabase for DB/Auth
* TDD with Jest, logs with structured JSON, manual setup via Supabase + Render + Vercel
