/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // השתמש בייצוא סטטי רק עבור בנייה של Capacitor/Android
  output: process.env.CAPACITOR_BUILD === 'true' ? 'export' : undefined,
  images: {
    unoptimized: true,
  },
}

module.exports = nextConfig

