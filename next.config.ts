import type { NextConfig } from 'next';
const nextConfig: NextConfig = {
  reactStrictMode: true,
  outputFileTracingRoot: process.cwd(),
  eslint: { ignoreDuringBuilds: true },
  images: { remotePatterns: [{ protocol: 'https', hostname: '**' }] },
  webpack: (config) => {
    config.resolve.alias['react-router-dom'] = require('path').resolve(process.cwd(), 'src/lib/router-compat.tsx');
    return config;
  },
};
export default nextConfig;
