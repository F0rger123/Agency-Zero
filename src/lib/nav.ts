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
  { label: "Dashboard", href: "/", icon: "dashboard" },
  { label: "Clients", href: "/clients", icon: "clients" },
  { label: "Projects", href: "/projects", icon: "projects" },
  { label: "Tasks", href: "/tasks", icon: "tasks" },
  { label: "Calendar", href: "/calendar", icon: "calendar" },
  { label: "Workload", href: "/workload", icon: "workload" },
  { label: "Reminders", href: "/reminders", icon: "reminders" },
  { label: "Services", href: "/services", icon: "services" },
  { label: "Quotes", href: "/quotes", icon: "quotes" },
  { label: "Contracts", href: "/contracts", icon: "contracts" },
  { label: "Invoices", href: "/invoices", icon: "invoices" },
  { label: "Social", href: "/social", icon: "social", planned: true },
  { label: "Marketing", href: "/marketing", icon: "marketing", planned: true },
  { label: "Settings", href: "/settings", icon: "settings" },
] as const;

/** A nav entry; `planned` sections are placeholders shown in a separate, muted group. */
export type NavItem = { label: string; href: string; icon: string; planned?: boolean };
export type IconName = (typeof navItems)[number]["icon"] | "menu" | "close";
