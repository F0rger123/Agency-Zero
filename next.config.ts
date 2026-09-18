import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Client files are uploaded through authenticated server actions. Keep the
  // framework request limit just above the 10 MB product-level file guard.
  experimental: {
    serverActions: {
      bodySizeLimit: "12mb",
    },
    // Faster sidebar navigation (D-031): nav routes are prefetched on hover,
    // focus, and idle; 30s of router-cache staleness for dynamic pages keeps
    // those prefetches useful while staying acceptably fresh. Server actions
    // revalidate their own paths after every mutation.
    staleTimes: {
      dynamic: 30,
    },
  },
};

export default nextConfig;
