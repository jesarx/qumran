import type { NextConfig } from "next";

const API_PROTOCOL = process.env.API_PROTOCOL || 'https';
const API_HOST = process.env.API_HOST;
const API_PATH = process.env.API_PATH || '/**';

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
};

export default nextConfig;
