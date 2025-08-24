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

  webpack: (config, { dev }) => {
    // Reduce bundle size by excluding unnecessary polyfills
    config.resolve.fallback = {
      ...config.resolve.fallback,
      fs: false,
      net: false,
      tls: false,
      encoding: false,
      crypto: false,
      stream: false,
      assert: false,
      http: false,
      https: false,
      os: false,
      url: false,
    };

    // Exclude problematic modules that cause slow compilation
    config.externals.push(
      'pino-pretty',
      'lokijs',
      'encoding',
      'bufferutil',
      'utf-8-validate',
      'supports-color'
    );

    // Speed up development builds
    if (dev) {
      config.optimization.splitChunks = {
        chunks: 'all',
        cacheGroups: {
          default: false,
          vendors: false,
          vendor: {
            chunks: 'all',
            test: /node_modules/,
            name: 'vendor',
            enforce: true,
          },
        },
      };
    }

    return config;
  },
};

export default nextConfig;
