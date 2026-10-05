/**
 * Primary navigation — MASTER_SPEC §3 (simple, modern dashboard style).
 * Order matches the product flow: operate (dashboard → work) → sell
 * (services → quotes → contracts → invoices) → deliver (social, marketing) →
 * configure. `Services` sits with the sell group because the catalogue is what
 * assignments and quote lines are built from.
 *
 * Every item is prefetched on idle/hover/focus by the app shell (D-031/D-034).
 */
export const navItems = [
  { label: "Dashboard", href: "/app", icon: "dashboard" },
  { label: "Leads", href: "/app/leads", icon: "leads" },
  { label: "Clients", href: "/app/clients", icon: "clients" },
  { label: "Projects", href: "/app/projects", icon: "projects" },
  { label: "Tasks", href: "/app/tasks", icon: "tasks" },
  { label: "Calendar", href: "/app/calendar", icon: "calendar" },
  { label: "Shoots", href: "/app/shoots", icon: "shoots" },
  { label: "Workload", href: "/app/workload", icon: "workload" },
  { label: "Reminders", href: "/app/reminders", icon: "reminders" },
  { label: "Services", href: "/app/services", icon: "services" },
  { label: "Quotes", href: "/app/quotes", icon: "quotes" },
  { label: "Contracts", href: "/app/contracts", icon: "contracts" },
  { label: "Invoices", href: "/app/invoices", icon: "invoices" },
  { label: "Social", href: "/app/social", icon: "social" },
  { label: "Marketing", href: "/app/marketing", icon: "marketing" },
  { label: "Settings", href: "/app/settings", icon: "settings" },
] as const;

/** A nav entry; `planned` sections are placeholders shown in a separate, muted group. */
export type NavItem = { label: string; href: string; icon: string; planned?: boolean };
export type IconName = (typeof navItems)[number]["icon"] | "menu" | "close";
