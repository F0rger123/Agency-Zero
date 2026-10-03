/**
 * Route map for the two halves of the site.
 *
 *   /            public marketing site (no login)
 *   /app/...     protected Agency Zero CRM (owner / authorised team only)
 *   /login       sign-in (public)
 *   /q/<token>   customer quote link (public, tokenised)
 *   /c/<token>   customer contract link (public, tokenised)
 *
 * Every in-app link goes through these helpers so the CRM mount point is
 * defined in exactly one place.
 */
export const APP_BASE = "/app";

/** `appPath("/clients/123")` → `/app/clients/123`; `appPath("/")` → `/app`. */
export function appPath(path = "/"): string {
  if (path === "/" || path === "") return APP_BASE;
  return `${APP_BASE}${path.startsWith("/") ? path : `/${path}`}`;
}

/**
 * Normalises a CRM link that may come from a database read model. Several SQL
 * read models (migrations 0011–0013) emit app-relative links such as
 * `/invoices/<id>`; this prefixes them and leaves already-prefixed links alone.
 */
export function crmHref(href: string): string {
  if (!href.startsWith("/")) return href;
  if (href === APP_BASE || href.startsWith(`${APP_BASE}/`)) return href;
  return appPath(href);
}

export function isCrmPath(pathname: string): boolean {
  return pathname === APP_BASE || pathname.startsWith(`${APP_BASE}/`);
}

/**
 * Only same-site CRM paths are accepted as a post-login destination, so a
 * crafted `?next=` can never bounce someone to another origin.
 */
export function safeNextPath(raw: string | null | undefined): string {
  if (!raw || !raw.startsWith("/") || raw.startsWith("//") || raw.includes("\\")) return APP_BASE;
  return isCrmPath(raw.split(/[?#]/)[0]) ? raw : APP_BASE;
}
