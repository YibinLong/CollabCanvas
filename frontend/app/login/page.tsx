/**
 * Login Page (PR #21)
 * 
 * WHY: Users need a page to authenticate with email/password
 * 
 * WHAT: Provides a login form that:
 * - Accepts email and password
 * - Validates input
 * - Calls login() from AuthContext
 * - Redirects to canvas on success
 * - Shows error messages on failure
 * 
 * HOW: Uses React state for form data and useAuth hook for authentication
 */

'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/lib/AuthContext';

export default function LoginPage() {
  const router = useRouter();
  const { login } = useAuth();

  // Form state
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [isSlowLoad, setIsSlowLoad] = useState(false);

  /**
   * Slow Load Detection
   * 
   * WHY: Free-tier hosting (Render) takes 30-60 seconds to wake up from sleep.
   * We want to show a friendly message so users know what's happening.
   * 
   * HOW: After 5 seconds of loading, we show a "waking up server" message.
   */
  useEffect(() => {
    let timer: NodeJS.Timeout;
    
    if (loading) {
      // After 5 seconds of loading, show the "waking up" message
      timer = setTimeout(() => {
        setIsSlowLoad(true);
      }, 5000);
    } else {
      // Reset when loading stops
      setIsSlowLoad(false);
    }
    
    // Cleanup timer if component unmounts or loading changes
    return () => clearTimeout(timer);
  }, [loading]);

  /**
   * Handle Form Submit
   * 
   * WHY: Process login when user submits the form
   * 
   * WHAT:
   * 1. Prevent default form submission (would reload page)
   * 2. Validate inputs
   * 3. Call login() function
   * 4. Redirect to canvas on success
   * 5. Show error on failure
   */
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Clear previous errors
    setError('');
    
    // Validate inputs
    if (!email || !password) {
      setError('Please fill in all fields');
      return;
    }

    try {
      setLoading(true);
      
      // Call login function from AuthContext
      await login(email, password);
      
      // Success! Redirect to canvas
      router.push('/');
    } catch (err: any) {
      // Show error message
      setError(err.message || 'Failed to login. Please check your credentials.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-gray-800 rounded-lg shadow-xl p-8 border border-gray-700">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-white mb-2">
            Welcome Back
          </h1>
          <p className="text-gray-400">
            Login to CollabCanvas
          </p>
        </div>

        {/* Error Message */}
        {error && (
          <div className="mb-4 p-3 bg-red-500/10 border border-red-500 rounded text-red-400 text-sm">
            {error}
          </div>
        )}

        {/* Slow Load Warning - Shows when backend is waking up */}
        {isSlowLoad && !error && (
          <div className="mb-4 p-4 bg-blue-500/10 border border-blue-500 rounded text-blue-300 text-sm">
            <div className="flex items-center gap-3">
              {/* Cute Spinning Logo */}
              <div className="flex-shrink-0">
                <svg
                  className="animate-spin h-6 w-6 text-blue-400"
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                >
                  <circle
                    className="opacity-25"
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    strokeWidth="4"
                  />
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                  />
                </svg>
              </div>
              {/* Friendly Message */}
              <div>
                <p className="font-medium mb-1">☕ Waking up the server...</p>
                <p className="text-xs text-blue-400/80">
                  First login may take up to a minute. Thanks for your patience! 🚀
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Login Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Email Input */}
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-gray-300 mb-2">
              Email
            </label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="your@email.com"
              disabled={loading}
              data-testid="email-input"
            />
          </div>

          {/* Password Input */}
          <div>
            <label htmlFor="password" className="block text-sm font-medium text-gray-300 mb-2">
              Password
            </label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="••••••••"
              disabled={loading}
              data-testid="password-input"
            />
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={loading}
            className="w-full py-2 px-4 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 disabled:cursor-not-allowed text-white font-medium rounded-lg transition-colors duration-200"
            data-testid="login-button"
          >
            {loading ? 'Logging in...' : 'Login'}
          </button>
        </form>

        {/* Signup Link */}
        <div className="mt-6 text-center text-gray-400 text-sm">
          Don't have an account?{' '}
          <Link
            href="/signup"
            className="text-blue-400 hover:text-blue-300 font-medium"
          >
            Sign up
          </Link>
        </div>

        {/* Info Note */}
        <div className="mt-8 p-4 bg-gray-700/50 rounded-lg border border-gray-600">
          <p className="text-xs text-gray-400 text-center">
            🎨 Secure collaborative design tool
            <br />
            Create an account or login to start designing.
          </p>
        </div>
      </div>
    </div>
  );
}

