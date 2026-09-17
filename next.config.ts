import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Client files are uploaded through authenticated server actions. Keep the
  // framework request limit just above the 10 MB product-level file guard.
  experimental: {
    serverActions: {
      bodySizeLimit: "12mb",
    },
  },
};

export default nextConfig;
