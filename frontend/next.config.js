/** @type {import('next').NextConfig} */
const nextConfig = {
  // Enable React strict mode for better error detection during development
  reactStrictMode: true,
  
  // Optimize images (useful for profile pictures, logos, etc.)
  images: {
    domains: ['localhost'],
  },

  // Environment variables that should be available in the browser
  // (Will be added from .env.local automatically if prefixed with NEXT_PUBLIC_)
  env: {
    NEXT_PUBLIC_API_URL: process.env.NEXT_PUBLIC_API_URL,
    NEXT_PUBLIC_WS_URL: process.env.NEXT_PUBLIC_WS_URL,
  },

  // Disable ESLint during production builds (for faster deployment)
  // ESLint still runs during 'npm run lint' locally
  eslint: {
    ignoreDuringBuilds: true,
  },

  // Disable TypeScript type checking during builds (optional - faster builds)
  // TypeScript still checks during development
  typescript: {
    ignoreBuildErrors: false, // Keep this to catch real type errors
  },
}

module.exports = nextConfig

