// next.config.js
/** @type {import('next').NextConfig} */
const nextConfig = {
  // Enable React strict mode for better error handling
  reactStrictMode: true,
  // Enable SWC for faster builds
  swcMinify: true,
  // Configure TypeScript paths
  experimental: {
    // Enable TypeScript path aliases
    tsconfigPaths: true,
  },
}

module.exports = nextConfig