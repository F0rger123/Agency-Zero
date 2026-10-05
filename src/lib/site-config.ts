/**
 * Public-site content that the owner will want to edit in one place.
 * Anything marked TODO(content) is a placeholder to replace with real details.
 */
export const site = {
  name: "Agency Zero",
  wordmark: "AGENCY ZER0",
  // TODO(content): phone number (and other socials) if wanted.
  email: "agencyzeroteam@gmail.com",
  owner: "Luke Knight",
  instagram: "https://www.instagram.com/agency.zer0/",
  /**
   * Search Console / Bing HTML-tag verification codes (the content="..." value only). These are public, not secrets, so they
   * can live here as a fallback if the NEXT_PUBLIC_* build variables are not available at build time.
   */
  googleVerification: "",
  bingVerification: "",
  /** Google Business Profile public URL (the "Share" link). Set NEXT_PUBLIC_GBP_URL after the profile is verified. */
  gbp: process.env.NEXT_PUBLIC_GBP_URL || "",
  socials: [{ label: "Instagram", href: "https://www.instagram.com/agency.zer0/" }],
} as const;

export const nav = [
  { label: "Home", href: "/" },
  { label: "Services", href: "/services" },
  { label: "Work", href: "/work" },
  { label: "About Luke", href: "/about" },
  { label: "Contact", href: "/contact" },
] as const;

export type ServiceSlug = "software" | "websites" | "seo" | "meta-ads" | "social" | "content";

export const services: readonly {
  slug: ServiceSlug;
  index: string;
  title: string;
  short: string;
  summary: string;
  /** Plain-language outcomes (no guarantees, no invented numbers). */
  points: readonly string[];
}[] = [
  {
    slug: "software",
    index: "01",
    title: "Custom software & CRMs",
    short: "Software",
    summary: "Custom CRMs, internal tools, customer portals and automation, built around the way your business actually works.",
    points: ["Less repetitive admin", "One system instead of five disconnected tools", "Software that matches your workflow, not the other way around"],
  },
  {
    slug: "websites",
    index: "02",
    title: "Websites",
    short: "Websites",
    summary: "Fast, custom-designed websites built to bring in calls, bookings and inquiries, not just to look good.",
    points: ["Designed from scratch, no templates", "Fast and easy to use on any phone", "Set up for search from day one"],
  },
  {
    slug: "seo",
    index: "03",
    title: "SEO & AI search (AEO)",
    short: "SEO & AEO",
    summary: "Be easier to find on Google, in maps and in AI answers, with clear pages, a strong local presence and honest reporting.",
    points: ["Technical and on-page fixes", "Google Business Profile and local listings", "Content that answers real customer questions"],
  },
  {
    slug: "meta-ads",
    index: "04",
    title: "Meta ads",
    short: "Meta ads",
    summary: "Facebook and Instagram ads with the creative, tracking and testing to show what your budget is actually doing.",
    points: ["Creative made for the feed", "Tracking you can read", "Steady testing instead of guesswork"],
  },
  {
    slug: "social",
    index: "05",
    title: "Social media",
    short: "Social",
    summary: "Planned, on-brand posting and community replies, so your accounts stay active without eating your week.",
    points: ["A content calendar you approve", "Posts and replies in your voice", "Monthly reporting in plain English"],
  },
  {
    slug: "content",
    index: "06",
    title: "Video & content",
    short: "Video",
    summary: "Short-form video, photos and ad creative, planned in batches so one shoot day feeds weeks of content.",
    points: ["Short-form video and shoots", "Ad and campaign creative", "One production plan for every channel"],
  },
];
