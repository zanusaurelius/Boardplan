import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  serverExternalPackages: ["@prisma/client", "prisma"],
  images: {
    localPatterns: [
      {
        pathname: "/uploads/**",
      },
    ],
  },
};

export default nextConfig;
