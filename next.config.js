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
  // Disable turbopack completely to avoid runtime issues
  experimental: {
    // Remove turbo configuration entirely
  },
  // Force webpack for production builds
  webpack: (config, { isServer }) => {
    return config
  },
}

module.exports = nextConfig
