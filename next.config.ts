import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: false,
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'yzufzpspujgtjvufjweu.supabase.co',
        pathname: '/storage/v1/object/public/**',
      },
      {
        protocol: 'https',
        hostname: 'imagedelivery.net',
        pathname: '/8T0nNNTEZGErCcqH8ClsqQ/6276e23b-9789-4d5d-a138-fe6480d57800/public/**',
      },
    ],
  },
};

export default nextConfig;