// next.config.mjs
/** @type {import('next').NextConfig} */
const nextConfig = {
  // Fix cross-origin issues for fly.dev
  allowedDevOrigins: [
    '*.fly.dev',
    'ecefd70eea9d4364b9043636178e092d-c9d3c388-1862-406c-bb93-a955e3.fly.dev'
  ],

  // Optimize development
  swcMinify: true,
  compiler: {
    removeConsole: process.env.NODE_ENV === 'production',
  },

  images: {
    remotePatterns: [
      { protocol: 'https', hostname: 'ipfs.io' },
      { protocol: 'https', hostname: '**.mypinata.cloud' },
      { protocol: 'https', hostname: 'gateway.pinata.cloud' },
    ],
  },

  webpack: (config, { dev, isServer }) => {
    // Optimize bundle
    config.resolve.alias = {
      ...(config.resolve.alias || {}),
      'pino-pretty': false,
      'react-native': false,
      '@metamask/sdk': false,
    };

    config.resolve.fallback = {
      ...(config.resolve.fallback || {}),
      encoding: false,
      fs: false,
      net: false,
      tls: false,
    };

    // Speed up development builds
    if (dev && !isServer) {
      config.cache = {
        type: 'filesystem',
        buildDependencies: {
          config: [__filename],
        },
      };
    }

    return config;
  },

  // Development optimizations
  experimental: {
    optimizePackageImports: ['lucide-react', 'framer-motion'],
  },
};

export default nextConfig;
