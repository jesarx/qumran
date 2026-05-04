import type { NextConfig } from "next";

const API_PROTOCOL = process.env.API_PROTOCOL || 'https';
const API_HOST = process.env.API_HOST;
const API_PATH = process.env.API_PATH || '/**';

const securityHeaders = [
  { key: 'X-DNS-Prefetch-Control', value: 'on' },
  { key: 'X-Frame-Options', value: 'SAMEORIGIN' },
  { key: 'X-Content-Type-Options', value: 'nosniff' },
  { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
  { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=()' },
  {
    key: 'Strict-Transport-Security',
    value: 'max-age=63072000; includeSubDomains; preload',
  },
];

const nextConfig: NextConfig = {
  images: {
    remotePatterns: API_HOST ? [
      {
        protocol: API_PROTOCOL as 'http' | 'https',
        hostname: API_HOST,
        port: '',
        pathname: API_PATH,
      },
    ] : [],
  },
  async headers() {
    return [
      {
        source: '/:path*',
        headers: securityHeaders,
      },
    ];
  },
};

export default nextConfig;
