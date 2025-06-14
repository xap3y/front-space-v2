import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: false,
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
