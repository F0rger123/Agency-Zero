import type { MetadataRoute } from "next";
import { siteUrl } from "@/lib/seo";

const privatePaths = ["/app", "/login", "/auth", "/q/", "/c/"];

/**
 * Search and AI crawlers are explicitly welcome on the public marketing pages (answer engines can only cite what they can
 * read). The CRM, login and customer-link routes stay private for everyone.
 */
const crawlers = [
  "Googlebot", "Bingbot", "Applebot", "DuckDuckBot",
  "GPTBot", "OAI-SearchBot", "ChatGPT-User", "ClaudeBot", "Claude-User", "Claude-SearchBot",
  "PerplexityBot", "Perplexity-User", "Google-Extended", "Applebot-Extended", "CCBot", "Amazonbot", "meta-externalagent",
];

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      { userAgent: "*", allow: "/", disallow: privatePaths },
      ...crawlers.map((userAgent) => ({ userAgent, allow: "/", disallow: privatePaths })),
    ],
    sitemap: `${siteUrl}/sitemap.xml`,
    host: siteUrl,
  };
}
