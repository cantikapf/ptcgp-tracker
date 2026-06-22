import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  serverExternalPackages: ['puppeteer-extra', 'puppeteer-extra-plugin-stealth', 'puppeteer'],
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'assets.pokemon-zone.com',
      },
    ],
  },
};

export default nextConfig;
