"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState, type ReactNode } from "react";
import { CrmLogo } from "@/components/crm-logo";
import { Icon } from "@/components/icons";
import { Modal } from "@/components/modal";
import { homeWidgets, navItems, type IconName } from "@/lib/nav";
import { signOut } from "@/app/actions/auth";
import { QuickNote } from "@/app/app/quick-note/quick-note";
import { LockInProvider } from "@/app/app/lock-in/lock-in";

function Wordmark() {
  return (
    <Link href="/app" aria-label="Agency Zero home" className="press">
      <CrmLogo />
    </Link>
  );
}

/** Warm every section once the browser is idle so the first tap on any widget is instant. */
function usePrefetchSections() {
  const router = useRouter();
  useEffect(() => {
    const hrefs = [...homeWidgets.map((item) => item.href), "/app/settings"];
    const warm = () => hrefs.forEach((href) => router.prefetch(href));
    const idle = window as Window & { requestIdleCallback?: (cb: () => void) => number; cancelIdleCallback?: (id: number) => void };
    if (typeof idle.requestIdleCallback === "function") {
      const id = idle.requestIdleCallback(warm);
      return () => idle.cancelIdleCallback?.(id);
    }
    const timer = window.setTimeout(warm, 400);
    return () => window.clearTimeout(timer);
  }, [router]);
}

/**
 * CRM shell: no sidebar. A slim top bar (home, quick note, all sections, sign out) over a wide canvas.
 * Navigation happens through the big widgets on the home screen and inside each customer.
 * Rendered by the app layout, so it stays mounted across navigations and never flashes.
 */
export function AppShell({ email, children }: { email: string; children: ReactNode }) {
  const pathname = usePathname();
  const isHome = pathname === "/app";
  const [menuOpen, setMenuOpen] = useState(false);
  usePrefetchSections();

  return (
    <div className="min-h-screen">
      <header className="sticky top-0 z-30 border-b border-border bg-background/85 backdrop-blur-md">
        <div className="mx-auto flex h-16 w-full max-w-6xl items-center gap-3 px-5 lg:px-8">
          <Wordmark />
          {isHome ? null : (
            <Link
              href="/app"
              className="press ml-2 inline-flex items-center gap-1.5 rounded-full border border-border px-3 py-1.5 text-sm transition-colors hover:bg-muted"
            >
              <Icon name="dashboard" className="size-4" />
              Home
            </Link>
          )}
          <div className="ml-auto flex items-center gap-2">
            <QuickNote />
            <button
              type="button"
              onClick={() => setMenuOpen(true)}
              aria-label="All sections"
              className="press inline-flex items-center gap-2 rounded-full border border-border px-3.5 py-2 text-sm font-medium transition-colors hover:bg-muted"
            >
              <Icon name="menu" className="size-4" />
              <span className="max-sm:sr-only">Menu</span>
            </button>
          </div>
        </div>
      </header>

      <Modal open={menuOpen} onClose={() => setMenuOpen(false)} title="All sections" description={email ? `Signed in as ${email}` : undefined}>
        <nav aria-label="All sections">
          <ul className="grid gap-2 sm:grid-cols-2">
            {[...homeWidgets.map((item) => ({ label: item.label, href: item.href, icon: item.icon as IconName })), ...navItems.filter((item) => item.label === "Settings").map((item) => ({ label: item.label, href: item.href, icon: item.icon as IconName }))].map((item) => (
              <li key={item.href}>
                <Link
                  href={item.href}
                  prefetch
                  onClick={() => setMenuOpen(false)}
                  className="press flex items-center gap-3 rounded-lg border border-border px-4 py-3 text-sm transition-colors hover:bg-muted"
                >
                  <Icon name={item.icon} className="size-4 shrink-0" />
                  {item.label}
                </Link>
              </li>
            ))}
          </ul>
          <form action={signOut} className="mt-6 border-t border-border pt-5">
            <button type="submit" className="press rounded-md border border-border px-4 py-2 text-sm transition-colors hover:bg-muted">
              Sign out
            </button>
          </form>
        </nav>
      </Modal>

      <LockInProvider>
        <main>
          <div className="mx-auto w-full max-w-6xl px-5 py-8 lg:px-8 lg:py-10">{children}</div>
        </main>
      </LockInProvider>
    </div>
  );
}
