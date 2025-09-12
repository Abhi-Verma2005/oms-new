/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [
      { protocol: 'https', hostname: 'lh3.googleusercontent.com' },
      { protocol: 'https', hostname: 'avatars.githubusercontent.com' },
      { protocol: 'https', hostname: 'images.unsplash.com' },
      { protocol: 'https', hostname: 'pbs.twimg.com' },
    ],
  },
  // Disable turbopack for production builds to avoid runtime issues
  experimental: {
    turbo: {
      // Only use turbopack in development
      enabled: false,
    },
  },
}

module.exports = nextConfig
