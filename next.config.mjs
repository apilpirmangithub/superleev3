/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [
      { protocol: 'https', hostname: 'ipfs.io' },
      { protocol: 'https', hostname: '**.mypinata.cloud' },
      { protocol: 'https', hostname: 'gateway.pinata.cloud' },
    ],
  },
  webpack: (config) => {
    config.resolve.fallback = { ...(config.resolve.fallback || {}), encoding: false };
    return config;
  },
};
export default nextConfig;
