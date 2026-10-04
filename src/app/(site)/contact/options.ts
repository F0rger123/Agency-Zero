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

export const TIMELINES = ["As soon as possible", "In the next 1–3 months", "Just exploring for now"] as const;

/** Social profiles people can paste (a link or an @handle). */
export const SOCIAL_FIELDS = [
  { name: "social_instagram", label: "Instagram", placeholder: "instagram.com/yourbusiness or @yourbusiness" },
  { name: "social_facebook", label: "Facebook", placeholder: "facebook.com/yourbusiness" },
  { name: "social_tiktok", label: "TikTok", placeholder: "tiktok.com/@yourbusiness" },
  { name: "social_linkedin", label: "LinkedIn", placeholder: "linkedin.com/company/yourbusiness" },
  { name: "social_other", label: "Another link", placeholder: "Anywhere else people find you" },
] as const;
