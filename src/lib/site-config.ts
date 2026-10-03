/**
 * Public-site content that the owner will want to edit in one place.
 * Anything marked TODO(content) is a placeholder to replace with real details.
 */
export const site = {
  name: "Agency Zero",
  wordmark: "AGENCY ZER0",
  // TODO(content): real address, socials and phone.
  email: "hello@agencyzero.com",
  socials: [
    { label: "Instagram", href: "https://instagram.com/" },
    { label: "LinkedIn", href: "https://linkedin.com/" },
    { label: "YouTube", href: "https://youtube.com/" },
  ],
} as const;

export const nav = [
  { label: "Services", href: "/services" },
  { label: "Work", href: "/work" },
  { label: "About", href: "/about" },
  { label: "Contact", href: "/contact" },
] as const;

export type ServiceSlug = "software" | "websites" | "seo" | "meta-ads" | "social" | "content";

export const services: readonly {
  slug: ServiceSlug;
  index: string;
  title: string;
  short: string;
  summary: string;
}[] = [
  {
    slug: "software",
    index: "01",
    title: "Custom software & CRMs",
    short: "Software",
    summary: "Internal tools, CRMs and automations built around how your business actually runs.",
  },
  {
    slug: "websites",
    index: "02",
    title: "Websites",
    short: "Websites",
    summary: "Custom-designed, fast, responsive sites with motion, conversion and SEO built in.",
  },
  {
    slug: "seo",
    index: "03",
    title: "SEO",
    short: "SEO",
    summary: "Be easier to find in Google, AI search and local discovery.",
  },
  {
    slug: "meta-ads",
    index: "04",
    title: "Meta ads",
    short: "Meta Ads",
    summary: "Paid social on Facebook and Instagram: creative, targeting, tracking and iteration.",
  },
  {
    slug: "social",
    index: "05",
    title: "Social media",
    short: "Social",
    summary: "Consistent, on-brand organic presence without it becoming your second job.",
  },
  {
    slug: "content",
    index: "06",
    title: "Video & content",
    short: "Content",
    summary: "Short-form video, shoots and campaign creative that gives the other channels something to say.",
  },
];
