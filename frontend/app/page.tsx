/**
 * Home Page
 * 
 * WHY: This is the landing page users see when they visit the app.
 * Later, this will show a list of documents or redirect to login.
 * 
 * WHAT: For now, it's a simple placeholder that confirms the setup works.
 */
export default function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-24 bg-canvas-bg">
      <div className="text-center">
        <h1 className="text-4xl font-bold text-white mb-4">
          CollabCanvas
        </h1>
        <p className="text-gray-400 text-lg">
          Collaborative design tool with real-time sync and AI assistance
        </p>
        <div className="mt-8 p-4 bg-toolbar-bg rounded-lg">
          <p className="text-green-400 text-sm">✓ Frontend setup complete!</p>
        </div>
      </div>
    </main>
  );
}

