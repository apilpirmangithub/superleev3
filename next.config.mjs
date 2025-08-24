// next.config.mjs
/** @type {import('next').NextConfig} */
const nextConfig = {
  // Fix cross-origin issues for fly.dev
  allowedDevOrigins: [
    '*.fly.dev',
    'ecefd70eea9d4364b9043636178e092d-c9d3c388-1862-406c-bb93-a955e3.fly.dev'
  ],

  images: {
    remotePatterns: [
      { protocol: 'https', hostname: 'ipfs.io' },
      { protocol: 'https', hostname: '**.mypinata.cloud' },
      { protocol: 'https', hostname: 'gateway.pinata.cloud' },
    ],
  },

  webpack: (config) => {
    // Reduce bundle size by excluding unnecessary polyfills
    config.resolve.fallback = {
      ...config.resolve.fallback,
      fs: false,
      net: false,
      tls: false,
      encoding: false,
    };

    // Exclude problematic modules
    config.externals.push('pino-pretty', 'lokijs', 'encoding');

    return config;
  },
};

export default nextConfig;
