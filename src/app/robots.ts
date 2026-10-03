import type { MetadataRoute } from "next";

const base = (process.env.NEXT_PUBLIC_SITE_URL || "https://agencyzero.com").replace(/\/$/, "");

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [{ userAgent: "*", allow: "/", disallow: ["/app", "/login", "/auth", "/q/", "/c/"] }],
    sitemap: `${base}/sitemap.xml`,
  };
}
