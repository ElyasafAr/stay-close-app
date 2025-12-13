/** @type {import('next').NextConfig} */
const path = require('path')

const nextConfig = {
  reactStrictMode: true,
  // Static export for Capacitor
  output: 'export',
  // Disable image optimization for static export
  images: {
    unoptimized: true,
  },
  // Ensure NEXT_PUBLIC_* environment variables are accessible
  env: {
    // Next.js does this automatically, but this helps ensure it works
    NEXT_PUBLIC_API_URL: process.env.NEXT_PUBLIC_API_URL,
  },
  // Explicitly configure webpack to resolve TypeScript paths
  webpack: (config, { isServer }) => {
    // Resolve path aliases from tsconfig.json
    config.resolve.alias = {
      ...config.resolve.alias,
      '@': path.resolve(__dirname, '.'),
      '@/components': path.resolve(__dirname, 'components'),
      '@/services': path.resolve(__dirname, 'services'),
      '@/state': path.resolve(__dirname, 'state'),
      '@/i18n': path.resolve(__dirname, 'i18n'),
    }
    return config
  },
  // PWA support
  async headers() {
    return [
      {
        source: '/sw.js',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=0, must-revalidate',
          },
          {
            key: 'Service-Worker-Allowed',
            value: '/',
          },
        ],
      },
    ]
  },
}

module.exports = nextConfig

