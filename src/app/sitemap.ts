import type { MetadataRoute } from "next";
import { services } from "@/lib/site-config";

const base = (process.env.NEXT_PUBLIC_SITE_URL || "https://agencyzero.com").replace(/\/$/, "");

export default function sitemap(): MetadataRoute.Sitemap {
  const pages = ["", "/services", "/work", "/about", "/contact"].map((path) => ({
    url: `${base}${path}`,
    lastModified: new Date(),
    changeFrequency: "monthly" as const,
    priority: path === "" ? 1 : 0.8,
  }));
  const servicePages = services.map((service) => ({
    url: `${base}/services/${service.slug}`,
    lastModified: new Date(),
    changeFrequency: "monthly" as const,
    priority: 0.7,
  }));
  return [...pages, ...servicePages];
}
