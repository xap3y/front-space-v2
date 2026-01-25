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
    ]
  },
};

export default nextConfig;
