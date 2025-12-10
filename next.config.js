/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // Ensure NEXT_PUBLIC_* environment variables are accessible
  env: {
    // Next.js does this automatically, but this helps ensure it works
    NEXT_PUBLIC_API_URL: process.env.NEXT_PUBLIC_API_URL,
  },
}

module.exports = nextConfig

