/** Shared by the contact form (client) and its server action. */
export const SERVICE_OPTIONS = [
  { value: "software", label: "Custom CRM / software" },
  { value: "websites", label: "Website" },
  { value: "seo", label: "SEO" },
  { value: "meta-ads", label: "Meta ads" },
  { value: "social", label: "Social media" },
  { value: "content", label: "Video / content" },
  { value: "not-sure", label: "Not sure yet" },
] as const;

export const BUDGETS = [
  "Under $2k",
  "$2k – $5k",
  "$5k – $15k",
  "$15k – $50k",
  "$50k+",
  "Not sure yet",
] as const;
