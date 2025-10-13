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
}

module.exports = nextConfig

