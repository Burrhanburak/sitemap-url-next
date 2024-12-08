/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    serverActions: true,
  },
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '*.toptanturkiye.com',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'ideacdn.net',
        pathname: '/**',
      }
    ],
    unoptimized: true
  },
  webpack: (config, { isServer }) => {
    if (!isServer) {
      config.resolve.fallback = {
        ...config.resolve.fallback,
        'undici': false,
      };
    }
    return config;
  },
}

module.exports = nextConfig
