import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactCompiler: true,
  transpilePackages: ['react-bangla-pay-icons'],
  images: {
    remotePatterns: [
      { protocol: 'https', hostname: '**' },
      { protocol: 'http', hostname: '**' },
    ],
  },
  async rewrites() {
    return [
      {
        source: '/favicon.ico',
        destination: '/api/favicon',
      },
    ];
  },
};

export default nextConfig;
