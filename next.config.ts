import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  experimental: {
    serverActions: {
      // Default is 1MB; memory photo uploads (several images per submission) need more room.
      bodySizeLimit: "20mb",
    },
  },
};

export default nextConfig;
