import './globals.css';
import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import { AuthProvider } from '@/lib/AuthContext';

// Load Inter font from Google Fonts for modern, clean typography
const inter = Inter({ subsets: ['latin'] });

// Metadata for the app (shows in browser tab, search engines, etc.)
export const metadata: Metadata = {
  title: 'CollabCanvas - Collaborative Design Tool',
  description: 'Real-time collaborative design tool with AI assistance',
};

/**
 * Root Layout Component (Updated in PR #21)
 * 
 * WHY: This wraps every page in the app. It's where we set up:
 * - Global styles (Tailwind CSS)
 * - Fonts
 * - AuthProvider: Makes authentication available to all pages/components
 * 
 * WHAT: The {children} prop will be replaced with each page's content
 */
export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <AuthProvider>{children}</AuthProvider>
      </body>
    </html>
  );
}

