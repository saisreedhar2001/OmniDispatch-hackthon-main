/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  images: {
    domains: ['api.elevenlabs.io', 'maps.googleapis.com'],
  },
  experimental: {
    serverComponentsExternalPackages: ['@11labs/react'],
  },
  webpack: (config) => {
    config.externals = [...(config.externals || []), { canvas: 'canvas' }];
    return config;
  },
}

module.exports = nextConfig
