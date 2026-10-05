import type { MetadataRoute } from "next";
import { siteUrl } from "@/lib/seo";
import { services } from "@/lib/site-config";

// Update this date when page content meaningfully changes (a fresh date on every build tells crawlers nothing).
const updated = new Date("2026-10-05");

const pages: { path: string; priority: number; changeFrequency: "weekly" | "monthly" }[] = [
  { path: "", priority: 1, changeFrequency: "weekly" },
  { path: "/services", priority: 0.9, changeFrequency: "monthly" },
  { path: "/areas", priority: 0.8, changeFrequency: "monthly" },
  { path: "/faq", priority: 0.8, changeFrequency: "monthly" },
  { path: "/work", priority: 0.8, changeFrequency: "monthly" },
  { path: "/about", priority: 0.7, changeFrequency: "monthly" },
  { path: "/contact", priority: 0.7, changeFrequency: "monthly" },
];

export default function sitemap(): MetadataRoute.Sitemap {
  const servicePages = services.map((service) => ({
    url: `${siteUrl}/services/${service.slug}`,
    lastModified: updated,
    changeFrequency: "monthly" as const,
    priority: 0.9,
  }));
  return [
    ...pages.map((page) => ({ url: `${siteUrl}${page.path}`, lastModified: updated, changeFrequency: page.changeFrequency, priority: page.priority })),
    ...servicePages,
  ];
}
