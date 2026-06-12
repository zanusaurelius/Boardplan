import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  htmlLimitedBots: /.*/,
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
