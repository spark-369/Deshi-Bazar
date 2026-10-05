/** @type {import('next').NextConfig} */
const nextConfig = {
  // Never bundle Prisma's native engine — Vercel's function bundle limit would
  // be exceeded otherwise (its client uses an external engine binary).
  serverExternalPackages: ["@prisma/client", "prisma"],

  images: {
    // next/image optimization is a serverless function on Vercel's free tier.
    // Serving images unoptimized keeps the deployment within the free tier
    // limits while remote images are still proxied through <Image> safely.
    unoptimized: true,
    remotePatterns: [
      {
        protocol: "https",
        hostname: "encrypted-tbn0.gstatic.com",
      },
      {
        protocol: "https",
        hostname: "**.gstatic.com",
      },
      {
        protocol: "https",
        hostname: "**.googleusercontent.com",
      },
    ],
  },
};

module.exports = nextConfig;
