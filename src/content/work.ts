import type { ServiceSlug } from "@/lib/site-config";

/**
 * Selected work. These are PLACEHOLDER structures (no fabricated metrics) —
 * replace each entry with a real project. `placeholder: true` shows a visible
 * "Example" tag; remove it once the entry is real.
 */
export type WorkItem = {
  slug: string;
  placeholder: boolean;
  client: string;
  sector: string;
  title: string;
  problem: string;
  delivered: string[];
  outcome: string;
  services: ServiceSlug[];
};

export const work: WorkItem[] = [
  {
    slug: "service-business-crm",
    placeholder: true,
    client: "Your client here",
    sector: "Home services",
    title: "A CRM built around the way the team already works",
    problem: "Leads, quotes and jobs lived in four different tools and a lot of memory.",
    delivered: ["Custom CRM", "Quote → project → invoice flow", "Owner dashboard"],
    outcome: "Outcome to be added once the project is published.",
    services: ["software"],
  },
  {
    slug: "premium-brand-site",
    placeholder: true,
    client: "Your client here",
    sector: "Professional services",
    title: "A website that finally looks as good as the work",
    problem: "A dated template site was undermining a premium offer.",
    delivered: ["Custom design", "Motion and interaction", "SEO foundations"],
    outcome: "Outcome to be added once the project is published.",
    services: ["websites", "seo"],
  },
  {
    slug: "launch-campaign",
    placeholder: true,
    client: "Your client here",
    sector: "Local retail",
    title: "A launch campaign across paid and organic",
    problem: "A new offer needed attention fast, with creative that matched the brand.",
    delivered: ["Meta ads", "Short-form video", "Social content plan"],
    outcome: "Outcome to be added once the project is published.",
    services: ["meta-ads", "social", "content"],
  },
];
