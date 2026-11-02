import type { NextConfig } from 'next';
  async headers() {
    return [{ source: '/:path*', headers: securityHeaders }];
  },
const nextConfig: NextConfig = {
  reactStrictMode: true,
  outputFileTracingRoot: process.cwd(),
  eslint: { ignoreDuringBuilds: true },
  images: { remotePatterns: [{ protocol: 'https', hostname: '**' }] },
  const securityHeaders = [
  { key: 'X-Content-Type-Options', value: 'nosniff' },
  { key: 'X-Frame-Options', value: 'SAMEORIGIN' },
  { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
  { key: 'Permissions-Policy', value: 'camera=(self), microphone=(), geolocation=()' },
  { key: 'Strict-Transport-Security', value: 'max-age=63072000; includeSubDomains' },
];
  webpack: (config) => {
    config.resolve.alias['react-router-dom'] = require('path').resolve(process.cwd(), 'src/lib/router-compat.tsx');
    return config;
  },
};
export default nextConfig;
