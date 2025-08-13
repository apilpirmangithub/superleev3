/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [
      { protocol: 'https', hostname: 'ipfs.io' },
      // kalau kamu pakai gateway Pinata custom, tambahkan di sini:
      { protocol: 'https', hostname: '**.mypinata.cloud' },
      { protocol: 'https', hostname: 'gateway.pinata.cloud' },
      // tambahkan domain lain yang kamu pakai untuk metadata/gambar
    ],
  },
  // optional kalau perlu strict SWC/webpack custom
};

module.exports = nextConfig;
