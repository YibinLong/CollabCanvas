# CollabCanvas Frontend

The frontend is a **Next.js** application built with **React** and **TypeScript**. It renders the collaborative canvas and handles all user interactions.

## 🎯 What This Does

- **Canvas rendering** - Uses SVG to draw shapes (rectangles, circles, lines, text)
- **User interactions** - Pan, zoom, select, move, resize shapes
- **Real-time sync** - Connects to backend via Yjs WebSocket to sync changes with other users
- **Multiplayer cursors** - Shows where other users are pointing
- **AI assistant** - Chat interface to create/modify shapes using natural language
- **Authentication** - Login/signup with Supabase Auth

## 📁 Folder Structure

```
frontend/
├── app/                    # Next.js 13+ App Router
│   ├── layout.tsx         # Root layout (wraps all pages)
│   ├── page.tsx           # Home page
│   └── globals.css        # Global styles + Tailwind
│
├── components/            # React components
│   ├── canvas/           # Canvas, shapes, selection
│   ├── toolbar/          # Top toolbar with tools
│   ├── properties/       # Properties panel
│   ├── presence/         # Multiplayer cursors
│   ├── ai/              # AI assistant chat
│   └── auth/            # Login/signup forms
│
├── hooks/                # Custom React hooks
│   ├── useCanvas.ts     # Canvas state and interactions
│   ├── useYjs.ts        # Yjs real-time sync
│   └── useAuth.ts       # Authentication state
│
├── lib/                  # Utilities and helpers
│   ├── api.ts           # Functions to call backend API
│   ├── yjs.ts           # Yjs document setup
│   └── utils.ts         # Helper functions
│
├── types/               # TypeScript type definitions
│   ├── canvas.ts        # Shape types, canvas state
│   ├── document.ts      # Document metadata
│   ├── user.ts          # User and presence types
│   └── ai.ts            # AI command types
│
└── package.json         # Dependencies and scripts
```

## 🚀 Getting Started

### 1. Install Dependencies

```bash
cd frontend
npm install
```

### 2. Set Up Environment Variables

Copy `.env.example` to `.env.local` and fill in your values:

```bash
cp .env.example .env.local
```

Edit `.env.local`:
```
NEXT_PUBLIC_API_URL=http://localhost:4000
NEXT_PUBLIC_BACKEND_URL=http://localhost:4000
NEXT_PUBLIC_WS_URL=ws://localhost:4001
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
```

**New:** `NEXT_PUBLIC_BACKEND_URL` enables automatic backend warmup to prevent cold-start delays on free-tier hosting (like Render). See [Backend Warmup Guide](../docs/guides/BACKEND_WARMUP.md) for details.

### 3. Run Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

## 📦 Key Dependencies

| Package | Purpose |
|---------|---------|
| `next` | React framework with server-side rendering |
| `react` | UI library for building components |
| `zustand` | Lightweight state management |
| `yjs` | CRDT for real-time collaboration |
| `y-websocket` | WebSocket provider for Yjs |
| `tailwindcss` | Utility-first CSS framework |
| `@supabase/supabase-js` | Authentication and database client |

## 🧪 Testing

Run tests with:

```bash
npm test
```

Tests use **Jest** and **React Testing Library**.

## 🎨 Styling

This project uses **TailwindCSS** for styling. Custom colors and animations are defined in `tailwind.config.js`.

Example:
```tsx
<div className="bg-canvas-bg text-white p-4 rounded-lg">
  Canvas content
</div>
```

## 📝 Scripts

```bash
npm run dev      # Start development server
npm run build    # Build for production
npm start        # Start production server
npm run lint     # Run ESLint
npm run format   # Format code with Prettier
```

## 🔗 Related

- [Backend README](../backend/README.md)
- [PRD](../PRD.md)
- [Task List](../TASK_LIST.md)

