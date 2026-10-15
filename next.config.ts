import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  trailingSlash: true,
  images: {
    // Images are served from Cloudflare R2
    unoptimized: true,
  },
};

export default nextConfig;
