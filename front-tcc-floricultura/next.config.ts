import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Allow next/image to optimize and load external images from trusted hosts.
  // Add any hosts you use for remote images here. Restart the dev server after changing.
  images: {
    domains: ['www.ikebanaflores.com.br'],
    // remotePatterns give finer control (protocol/hostname/path) and are available in newer Next.js
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'www.ikebanaflores.com.br',
        port: '',
        pathname: '/**',
      },
    ],
    // If you want to allow any external origin without listing domains one-by-one,
    // you can disable Next.js image optimization. This will make <Image /> render
    // unoptimized <img> tags and accept any src. Use with caution — you lose
    // automatic optimization (resizing, caching, proxying) and may impact performance.
    // Set to `true` to allow any origin.
    unoptimized: true,
  },
};

export default nextConfig;
