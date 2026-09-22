import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Client files are uploaded through authenticated server actions. Keep the
  // framework request limit just above the 10 MB product-level file guard.
  experimental: {
    serverActions: {
      bodySizeLimit: "12mb",
    },
    // Sidebar navigation (D-031/D-034): every app route is dynamic because it
    // reads the auth cookie, so the router cache is what makes repeat
    // navigations instant. `dynamic: 30` keeps a prefetched section valid for
    // 30 seconds; server actions call `revalidatePath` after every mutation, so
    // a permanent staleness window is never created. Static assets get the
    // framework default extended to three minutes.
    staleTimes: {
      dynamic: 30,
      static: 180,
    },
  },
};

export default nextConfig;
