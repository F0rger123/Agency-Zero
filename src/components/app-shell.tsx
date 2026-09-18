"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState, type ReactNode } from "react";
import { navItems } from "@/lib/nav";
import { Icon } from "@/components/icons";
import { signOut } from "@/app/actions/auth";

function Wordmark() {
  return (
    <Link href="/" className="flex items-center gap-3 px-3">
      <span aria-hidden className="block size-3 rounded-[3px] bg-foreground" />
      <span
        className="wordmark text-xl font-bold tracking-tight"
        data-text="Agency Zero"
      >
        Agency Zero
      </span>
    </Link>
  );
}

function NavList({ onNavigate }: { onNavigate?: () => void }) {
  const pathname = usePathname();
  const router = useRouter();

  // Faster navigation (D-031): prefetch nav routes on hover/focus, and warm
  // every route once on mount during idle time so first visits are instant.
  // Dynamic pages benefit because staleTimes.dynamic keeps the prefetched
  // response for 30 seconds; server actions still revalidate after mutations.
  useEffect(() => {
    const timers = navItems.map((item, index) =>
      window.setTimeout(() => router.prefetch(item.href), 400 + index * 150)
    );
    return () => timers.forEach((timer) => window.clearTimeout(timer));
  }, [router]);

  return (
    <nav aria-label="Main" className="flex flex-col gap-0.5 px-3">
      {navItems.map((item) => {
        const active =
          item.href === "/" ? pathname === "/" : pathname.startsWith(item.href);
        return (
          <Link
            key={item.href}
            href={item.href}
            onClick={onNavigate}
            onMouseEnter={() => router.prefetch(item.href)}
            onFocus={() => router.prefetch(item.href)}
            aria-current={active ? "page" : undefined}
            className={`flex items-center gap-3 rounded-md px-3 py-2 text-sm transition-colors ${
              active
                ? "bg-muted font-medium text-foreground"
                : "text-muted-foreground hover:bg-muted/60 hover:text-foreground"
            }`}
          >
            <Icon name={item.icon} className="size-4 shrink-0" />
            {item.label}
          </Link>
        );
      })}
    </nav>
  );
}

function SidebarFooter({ email }: { email: string }) {
  return (
    <div className="mt-auto border-t border-border px-3 py-4">
      <div className="px-3 pb-2">
        <p className="text-[11px] font-medium uppercase tracking-widest text-faint-foreground">
          Signed in
        </p>
        <p title={email} className="truncate text-sm text-muted-foreground">
          {email || "—"}
        </p>
      </div>
      <form action={signOut}>
        <button
          type="submit"
          className="w-full rounded-md px-3 py-2 text-left text-sm text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
        >
          Sign out
        </button>
      </form>
    </div>
  );
}

/**
 * Dashboard shell: fixed sidebar on desktop, slide-over drawer on mobile.
 * Layout rules from MASTER_SPEC §3 — generous spacing, hairline borders,
 * no cards, no color.
 */
export function AppShell({
  email,
  children,
}: {
  email: string;
  children: ReactNode;
}) {
  const [open, setOpen] = useState(false);

  return (
    <div className="min-h-screen">
      {/* Mobile top bar */}
      <header className="sticky top-0 z-30 flex h-16 items-center gap-2 border-b border-border bg-background px-4 lg:hidden">
        <button
          type="button"
          aria-label="Open menu"
          aria-expanded={open}
          onClick={() => setOpen(true)}
          className="-ml-2 rounded-md p-2 text-foreground transition-colors hover:bg-muted"
        >
          <Icon name="menu" className="size-5" />
        </button>
        <Wordmark />
      </header>

      {/* Desktop sidebar */}
      <aside className="fixed inset-y-0 left-0 z-30 hidden w-64 flex-col border-r border-border bg-background lg:flex">
        <div className="flex h-20 items-center">
          <Wordmark />
        </div>
        <NavList />
        <SidebarFooter email={email} />
      </aside>

      {/* Mobile drawer */}
      {open ? (
        <div
          className="fixed inset-0 z-40 lg:hidden"
          role="dialog"
          aria-modal="true"
          aria-label="Menu"
        >
          <button
            aria-label="Close menu"
            tabIndex={-1}
            onClick={() => setOpen(false)}
            className="absolute inset-0 bg-inverted/40"
          />
          <div className="absolute inset-y-0 left-0 flex w-68 flex-col border-r border-border bg-background">
            <div className="flex h-16 items-center justify-between pl-0 pr-3">
              <Wordmark />
              <button
                type="button"
                aria-label="Close menu"
                onClick={() => setOpen(false)}
                className="rounded-md p-2 text-foreground transition-colors hover:bg-muted"
              >
                <Icon name="close" className="size-5" />
              </button>
            </div>
            <NavList onNavigate={() => setOpen(false)} />
            <SidebarFooter email={email} />
          </div>
        </div>
      ) : null}

      <main className="lg:pl-64">
        <div className="mx-auto w-full max-w-5xl px-6 py-10 lg:px-10 lg:py-12">
          {children}
        </div>
      </main>
    </div>
  );
}
