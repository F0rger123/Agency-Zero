import type { ServiceSlug } from "@/lib/site-config";

/**
 * Selected work. Real entries have `placeholder: false`. Placeholders are
 * clearly tagged "Concept" in the UI and contain NO invented metrics.
 * TODO(content): replace the concepts with real projects as they are published.
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
  hero: { src: "/images/work/crewboss-hero.jpg", alt: "CrewBoss home page: \"Run your pressure washing business like a boss\" above the owner dashboard with revenue, active jobs, crew on shift and today's schedule", width: 2880, height: 2240 },
  features: { src: "/images/work/crewboss-features.jpg", alt: "CrewBoss features: scheduling and crew assignment, estimates, invoices and payments, Stripe, client portal, drag-and-drop automations, the Alfred AI assistant, mobile field portal, live crew tracking and job photos", width: 2400, height: 3112 },
  field: { src: "/images/work/crewboss-field.jpg", alt: "CrewBoss mobile field portal on a phone: today's jobs, a job checklist and a clock-out button, with the reasons it is built for the field", width: 2400, height: 1140 },
};

export const work: WorkItem[] = [
  {
    slug: "crewboss",
    placeholder: false,
    client: "CrewBoss — my own product",
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
    image: { ...crewboss.hero, fit: "cover" },
    href: crewboss.url,
  },
  {
    slug: "premium-brand-site",
    placeholder: true,
    client: "Agency Zero concept",
    sector: "Professional services",
    title: "A website that finally looks as good as the work",
    problem: "A dated template site was undermining a premium offer.",
    delivered: ["Custom design", "Motion and interaction", "SEO foundations"],
    outcome: "A concept showing the kind of work I would deliver for this type of business.",
    services: ["websites", "seo"],
    image: { src: "/images/mockups/work-site.jpg", alt: "Three concept websites side by side: an editorial architecture studio, a moody restaurant and a calm financial advisory firm", width: 2000, height: 1250 },
  },
  {
    slug: "launch-campaign",
    placeholder: true,
    client: "Agency Zero concept",
    sector: "Local business",
    title: "A launch campaign across paid and organic",
    problem: "A new offer needed attention fast, with creative that matched the brand.",
    delivered: ["Meta ads", "Short-form video", "Social content plan"],
    outcome: "A concept showing the kind of work I would deliver for this type of business.",
    services: ["meta-ads", "social", "content"],
    image: { src: "/images/mockups/work-campaign.jpg", alt: "A Meta feed ad, a before-and-after short-form video and a carousel ad from one concept launch campaign", width: 2000, height: 1250 },
  },
];
