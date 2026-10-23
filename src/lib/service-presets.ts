/**
 * Categories and ready-made starting points for the "New service" wizard. Presets only pre-fill the wizard (name,
 * description, one-time vs recurring, interval); there are deliberately no prices: those are yours to set.
 */
export const SERVICE_CATEGORIES = [
  "Websites",
  "SEO",
  "Paid ads",
  "Social and content",
  "Software and CRM",
  "Branding and design",
  "Care plans",
  "Consulting",
] as const;

export type ServicePreset = {
  category: (typeof SERVICE_CATEGORIES)[number];
  name: string;
  description: string;
  billing: "one_off" | "recurring";
  interval: "monthly" | "quarterly" | "yearly";
};

export const SERVICE_PRESETS: ServicePreset[] = [
  { category: "Websites", name: "Website design and build", description: "A custom website designed and built from scratch, mobile-friendly and ready to launch.", billing: "one_off", interval: "monthly" },
  { category: "Websites", name: "Website redesign", description: "A fresh design and rebuild of an existing website, keeping what already works.", billing: "one_off", interval: "monthly" },
  { category: "Websites", name: "Landing page", description: "A single focused page built to turn visitors into enquiries or sales.", billing: "one_off", interval: "monthly" },
  { category: "SEO", name: "SEO retainer", description: "Ongoing search optimisation: on-page fixes, content, and monthly reporting.", billing: "recurring", interval: "monthly" },
  { category: "SEO", name: "Local SEO", description: "Google Business Profile and local search work to show up for nearby customers.", billing: "recurring", interval: "monthly" },
  { category: "SEO", name: "SEO audit", description: "A one-off review of a site's search health with a prioritised fix list.", billing: "one_off", interval: "monthly" },
  { category: "Paid ads", name: "Meta ads management", description: "Setting up, running and optimising Facebook and Instagram ad campaigns.", billing: "recurring", interval: "monthly" },
  { category: "Paid ads", name: "Google Ads management", description: "Search ad campaigns built, managed and optimised each month.", billing: "recurring", interval: "monthly" },
  { category: "Paid ads", name: "Ad campaign setup", description: "A one-time build of ad accounts, audiences, creative and tracking.", billing: "one_off", interval: "monthly" },
  { category: "Social and content", name: "Social media management", description: "Planning, posting and engaging on the client's social accounts each month.", billing: "recurring", interval: "monthly" },
  { category: "Social and content", name: "Short-form video package", description: "A set of edited short videos for social, filmed and delivered on a schedule.", billing: "recurring", interval: "monthly" },
  { category: "Social and content", name: "Content shoot day", description: "A single on-location day capturing photo and video content.", billing: "one_off", interval: "monthly" },
  { category: "Social and content", name: "Email marketing", description: "Newsletters and automated email flows, written and sent each month.", billing: "recurring", interval: "monthly" },
  { category: "Software and CRM", name: "Custom software build", description: "A bespoke web application designed and built around the client's process.", billing: "one_off", interval: "monthly" },
  { category: "Software and CRM", name: "Custom CRM", description: "A CRM tailored to how the client sells and serves customers.", billing: "one_off", interval: "monthly" },
  { category: "Software and CRM", name: "Automation and integrations", description: "Connecting tools and automating repetitive work.", billing: "one_off", interval: "monthly" },
  { category: "Branding and design", name: "Logo and brand identity", description: "Logo, colours, type and a simple brand guide.", billing: "one_off", interval: "monthly" },
  { category: "Branding and design", name: "Graphic design", description: "Flyers, social graphics, decks and other design work.", billing: "one_off", interval: "monthly" },
  { category: "Care plans", name: "Website care plan", description: "Hosting, updates, backups, security and small edits, billed monthly.", billing: "recurring", interval: "monthly" },
  { category: "Care plans", name: "Software support plan", description: "Ongoing fixes, small improvements and priority support for custom software.", billing: "recurring", interval: "monthly" },
  { category: "Care plans", name: "Domain and hosting", description: "Domain registration and managed hosting, billed yearly.", billing: "recurring", interval: "yearly" },
  { category: "Consulting", name: "Strategy session", description: "A focused working session on marketing, growth or systems.", billing: "one_off", interval: "monthly" },
  { category: "Consulting", name: "Monthly consulting", description: "Regular calls and hands-on guidance each month.", billing: "recurring", interval: "monthly" },
];

/** Page grouping: known categories in order, then anything custom, then uncategorised. */
export function groupServices<T extends { category: string | null }>(services: T[]): { title: string; items: T[] }[] {
  const known: string[] = [...SERVICE_CATEGORIES];
  const titles = new Set<string>();
  for (const service of services) titles.add(service.category?.trim() || "Other");
  const ordered = [...titles].sort((a, b) => {
    const rank = (title: string) => (known.indexOf(title) >= 0 ? known.indexOf(title) : title === "Other" ? 10_000 : 1_000);
    return rank(a) - rank(b) || a.localeCompare(b);
  });
  return ordered.map((title) => ({
    title,
    items: services.filter((service) => (service.category?.trim() || "Other") === title),
  }));
}
