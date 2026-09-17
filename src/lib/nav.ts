/**
 * Primary navigation — MASTER_SPEC §3 (simple, modern dashboard style).
 * Order matches the product flow: operate (dashboard → work) → sell
 * (quotes → contracts → invoices) → deliver (social, marketing) → configure.
 */
export const navItems = [
  { label: "Dashboard", href: "/", icon: "dashboard" },
  { label: "Clients", href: "/clients", icon: "clients" },
  { label: "Projects", href: "/projects", icon: "projects" },
  { label: "Tasks", href: "/tasks", icon: "tasks" },
  { label: "Calendar", href: "/calendar", icon: "calendar" },
  { label: "Workload", href: "/workload", icon: "workload" },
  { label: "Reminders", href: "/reminders", icon: "reminders" },
  { label: "Quotes", href: "/quotes", icon: "quotes" },
  { label: "Contracts", href: "/contracts", icon: "contracts" },
  { label: "Invoices", href: "/invoices", icon: "invoices" },
  { label: "Social", href: "/social", icon: "social" },
  { label: "Marketing", href: "/marketing", icon: "marketing" },
  { label: "Settings", href: "/settings", icon: "settings" },
] as const;

export type NavItem = (typeof navItems)[number];
export type IconName = NavItem["icon"] | "menu" | "close";
