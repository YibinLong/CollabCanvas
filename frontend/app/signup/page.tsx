/**
 * Signup Page (PR #21)
 * 
 * WHY: New users need a page to create an account
 * 
 * WHAT: Provides a signup form that:
 * - Accepts email, password, and optional name
 * - Validates input (email format, password strength)
 * - Calls signup() from AuthContext
 * - Redirects to canvas on success
 * - Shows error messages on failure
 * 
 * HOW: Uses React state for form data and useAuth hook for authentication
 */

'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/lib/AuthContext';

export default function SignupPage() {
  const router = useRouter();
  const { signup } = useAuth();

  // Form state
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  /**
   * Handle Form Submit
   * 
   * WHY: Process signup when user submits the form
   * 
   * WHAT:
   * 1. Prevent default form submission
   * 2. Validate inputs (email format, password strength)
   * 3. Call signup() function
   * 4. Redirect to canvas on success
   * 5. Show error on failure
   */
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Clear previous errors
    setError('');
    
    // Validate inputs
    if (!email || !password) {
      setError('Please fill in all required fields');
      return;
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      setError('Please enter a valid email address');
      return;
    }

    // Validate password strength
    if (password.length < 6) {
      setError('Password must be at least 6 characters');
      return;
    }

    try {
      setLoading(true);
      
      // Call signup function from AuthContext
      await signup(email, password, name || undefined);
      
      // Success! Redirect to canvas
      router.push('/');
    } catch (err: any) {
      // Show error message
      setError(err.message || 'Failed to create account. Please try again.');
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
            Create Account
          </h1>
          <p className="text-gray-400">
            Join CollabCanvas today
          </p>
        </div>

        {/* Error Message */}
        {error && (
          <div className="mb-4 p-3 bg-red-500/10 border border-red-500 rounded text-red-400 text-sm">
            {error}
          </div>
        )}

        {/* Signup Form */}
        <form onSubmit={handleSubmit} className="space-y-4" data-testid="signup-form">
          {/* Name Input (Optional) */}
          <div>
            <label htmlFor="name" className="block text-sm font-medium text-gray-300 mb-2">
              Name <span className="text-gray-500">(optional)</span>
            </label>
            <input
              id="name"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="John Doe"
              disabled={loading}
            />
          </div>

          {/* Email Input */}
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-gray-300 mb-2">
              Email <span className="text-red-400">*</span>
            </label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="your@email.com"
              disabled={loading}
              required
              data-testid="email-input"
            />
          </div>

          {/* Password Input */}
          <div>
            <label htmlFor="password" className="block text-sm font-medium text-gray-300 mb-2">
              Password <span className="text-red-400">*</span>
            </label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="••••••••"
              disabled={loading}
              required
              data-testid="password-input"
            />
            <p className="mt-1 text-xs text-gray-500">
              Must be at least 6 characters
            </p>
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={loading}
            className="w-full py-2 px-4 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 disabled:cursor-not-allowed text-white font-medium rounded-lg transition-colors duration-200"
            data-testid="signup-button"
          >
            {loading ? 'Creating account...' : 'Create Account'}
          </button>
        </form>

        {/* Login Link */}
        <div className="mt-6 text-center text-gray-400 text-sm">
          Already have an account?{' '}
          <Link
            href="/login"
            className="text-blue-400 hover:text-blue-300 font-medium"
          >
            Login
          </Link>
        </div>

        {/* Demo Note */}
        <div className="mt-8 p-4 bg-gray-700/50 rounded-lg border border-gray-600">
          <p className="text-xs text-gray-400 text-center">
            🎨 <strong>Phase 5:</strong> Authentication is now live!
            <br />
            Your account will allow you to create and collaborate on designs.
          </p>
        </div>
      </div>
    </div>
  );
}

