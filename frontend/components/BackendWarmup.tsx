/**
 * Backend Warmup Component
 * 
 * WHY: Free-tier hosting services (like Render) spin down after 15 minutes of inactivity.
 * This can cause a 50+ second delay when users try to login/signup because the backend
 * needs to "wake up" first.
 * 
 * WHAT: This component pings the backend's /health endpoint as soon as the page loads.
 * By the time the user clicks "Login" or "Sign Up", the backend is already awake!
 * 
 * HOW IT WORKS:
 * 1. Runs immediately when any page loads (mounted in root layout)
 * 2. Sends a lightweight GET request to /health endpoint
 * 3. Runs silently in background - doesn't block page load or show errors
 * 4. Only pings once per page load (not repeatedly)
 */

'use client';

import { useEffect } from 'react';

export default function BackendWarmup() {
  useEffect(() => {
    // Function to ping the backend
    const wakeUpBackend = async () => {
      try {
        // Get backend URL from environment variable
        // This is set in your .env.local file (e.g., https://your-app.onrender.com)
        const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:4000';
        
        // Ping the health endpoint
        // We use fetch with a timeout to avoid hanging if backend is really slow
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 10000); // 10 second timeout
        
        const response = await fetch(`${backendUrl}/health`, {
          method: 'GET',
          signal: controller.signal,
        });
        
        clearTimeout(timeoutId);
        
        // Log success (only in development, not in production)
        if (process.env.NODE_ENV === 'development') {
          console.log('✓ Backend warmup successful:', await response.json());
        }
      } catch (error) {
        // Silently fail - we don't want to bother users with warmup errors
        // The backend might still be waking up, or there might be network issues
        // Either way, when the user actually tries to login, we'll show proper errors
        if (process.env.NODE_ENV === 'development') {
          console.log('Backend warmup attempt (may still be waking up):', error);
        }
      }
    };

    // Execute warmup immediately
    wakeUpBackend();
  }, []); // Empty dependency array = runs once when component mounts

  // This component doesn't render anything visible
  // It just runs the warmup logic in the background
  return null;
}

