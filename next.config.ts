import type { NextConfig } from "next";

/** @type {import('next').NextConfig} */
const nextConfig: NextConfig = {
  reactStrictMode: false,
  devIndicators: false,
  compress: true,
  experimental: {
    turbopackFileSystemCacheForBuild: true,
    // The CLI checker can lose captured stdout in sandboxed/container builds,
    // causing Next to report that it cannot parse `tsc --showConfig`.
    useTypeScriptCli: false,
  },
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
      }
    ]
  },
    images: {
        remotePatterns: [new URL('https://r2.xap3y.eu/**'), new URL('https://cdn.discordapp.com/**'), new URL('https://media.discordapp.net/**'), new URL('https://media.discordapp.com/**'), new URL('https://cdn.discordapp.com/attachments/**'), new URL('https://media.discordapp.net/attachments/**'), new URL('https://media.discordapp.com/attachments/**')],
    },
};

export default nextConfig;
