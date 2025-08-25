// next.config.mjs
/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [
      { protocol: 'https', hostname: 'ipfs.io' },
      { protocol: 'https', hostname: '**.mypinata.cloud' },
      { protocol: 'https', hostname: 'gateway.pinata.cloud' },
    ],
  },
  webpack: (config, { isServer }) => {
    config.resolve.alias = {
      ...(config.resolve.alias || {}),
      'pino-pretty': false,     // hilangkan warning modul optional
      'react-native': false,    // kalau tidak dipakai
      '@metamask/sdk': false,   // jika tidak pakai MetaMask SDK langsung (cukup injected)
    };

    config.resolve.fallback = {
      ...(config.resolve.fallback || {}),
      encoding: false,          // hilangkan warning "encoding"
      fs: false,
      net: false,
      tls: false,
    };

    // Handle SSR issues with wallet connectors
    if (isServer) {
      config.externals = [
        ...(config.externals || []),
        {
          'idb-keyval': 'idb-keyval',
          '@walletconnect/core': '@walletconnect/core',
          '@walletconnect/sign-client': '@walletconnect/sign-client',
          '@walletconnect/ethereum-provider': '@walletconnect/ethereum-provider',
        }
      ];
    }

    // Define globals for browser APIs that don't exist in Node.js
    config.plugins = [
      ...(config.plugins || []),
      new config.webpack.DefinePlugin({
        'process.env.WC_DISABLE_INTERNAL_STORAGE': JSON.stringify('true'),
      }),
    ];

    return config;
  },
};
export default nextConfig;
