import type { NextConfig } from "next";

/** @type {import('next').NextConfig} */
const nextConfig: NextConfig = {
  reactStrictMode: false,
  devIndicators: false,
  compress: true,
  async redirects() {
    return [
      {
        source: '/home',
        destination: '/home/dashboard',
        permanent: true,
      },
      {
        source: '/home/tools',
        destination: '/tools',
        permanent: true,
      },
    ]
  },
    images: {
        remotePatterns: [new URL('https://r3.xap3y.space/**'), new URL('https://r2.xap3y.eu/**')],
    },
};

export default nextConfig;
