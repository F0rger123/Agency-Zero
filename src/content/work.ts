import type { ServiceSlug } from "@/lib/site-config";

/**
 * Selected work. Real entries have `placeholder: false`. Placeholders are
 * clearly tagged "Example" in the UI and contain NO invented metrics.
 * TODO(content): replace the examples with real projects as they are published.
 */
export type WorkImage = { src: string; alt: string; width: number; height: number; fit?: "cover" | "contain" };

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
  image?: WorkImage;
  /** Live link (shown as "View live"). */
  href?: string;
};

export const crewboss = {
  url: "https://smocks-crm.pages.dev/",
  dashboard: { src: "/images/work/crewboss-dashboard.jpg", alt: "CrewBoss dashboard showing month-to-date revenue, active jobs, crew on shift, today's schedule and a live crew list", width: 1536, height: 704 },
  phone: { src: "/images/work/crewboss-phone.jpg", alt: "CrewBoss mobile field portal showing today's jobs, a job checklist and a clock-out button", width: 512, height: 594 },
  features: { src: "/images/work/crewboss-features.jpg", alt: "CrewBoss feature set: scheduling, estimates and invoices, Stripe payments, client portal, automations, AI assistant, field portal and live crew tracking", width: 1656, height: 1742 },
};

export const work: WorkItem[] = [
  {
    slug: "crewboss",
    placeholder: false,
    client: "CrewBoss — our own product",
    sector: "Field-service software",
    title: "CrewBoss: a CRM built specifically for pressure-washing businesses",
    problem:
      "Pressure-washing crews were running jobs from texts, notebooks and generic CRMs that weren't built for the field.",
    delivered: [
      "Scheduling & crew assignment",
      "Estimates, invoices & Stripe payments",
      "Client portal & mobile field portal",
      "Automations & an AI assistant",
    ],
    outcome: "Live as a product with a free trial. Customer results will be added here as they are collected.",
    services: ["software"],
    image: { ...crewboss.dashboard, fit: "contain" },
    href: crewboss.url,
  },
  {
    slug: "premium-brand-site",
    placeholder: true,
    client: "Example project",
    sector: "Professional services",
    title: "A website that finally looks as good as the work",
    problem: "A dated template site was undermining a premium offer.",
    delivered: ["Custom design", "Motion and interaction", "SEO foundations"],
    outcome: "Outcome to be added once the project is published.",
    services: ["websites", "seo"],
    image: { src: "/images/mockups/web-studio.jpg", alt: "Concept website for an architecture studio", width: 2160, height: 1350 },
  },
  {
    slug: "launch-campaign",
    placeholder: true,
    client: "Example project",
    sector: "Local business",
    title: "A launch campaign across paid and organic",
    problem: "A new offer needed attention fast, with creative that matched the brand.",
    delivered: ["Meta ads", "Short-form video", "Social content plan"],
    outcome: "Outcome to be added once the project is published.",
    services: ["meta-ads", "social", "content"],
    image: { src: "/images/mockups/ad-1.jpg", alt: "Concept Meta feed ad for a plumbing company", width: 1500, height: 1875 },
  },
];
