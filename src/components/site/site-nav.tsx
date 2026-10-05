"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { nav } from "@/lib/site-config";
import { SiteWordmark } from "./wordmark";

/**
 * Public navigation. Transparent over the hero, hairline + blur once scrolled.
 * Not a pill: a plain bar, so the headline owns the first screen.
 * The CRM entry is deliberately the quietest element in it.
 */
export function SiteNav() {
  const pathname = usePathname();
  // On the home page the hero already says "Agency Zero", so the wordmark is left out; the link row stays.
  const isHome = pathname === "/";
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 24);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    // Close the mobile menu on navigation.
    const id = requestAnimationFrame(() => setOpen(false));
    return () => cancelAnimationFrame(id);
  }, [pathname]);

  useEffect(() => {
    if (!open) return;
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = previous;
      window.removeEventListener("keydown", onKey);
    };
  }, [open]);

  return (
    <>
      <header
        className={`fixed inset-x-0 top-0 z-50 border-b transition-[background-color,border-color,backdrop-filter] duration-500 ${
          scrolled || open
            ? "border-rule bg-ink/70 backdrop-blur-md"
            : "border-transparent bg-transparent"
        }`}
      >
        <div className="site-wrap flex h-16 items-center justify-between md:h-[4.5rem]">
          {isHome ? <span aria-hidden /> : <SiteWordmark />}

          <nav aria-label="Primary" className="hidden items-center gap-10 md:flex">
            {nav.map((item) => {
              const active = item.href === "/" ? pathname === "/" : pathname === item.href || pathname.startsWith(`${item.href}/`);
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  aria-current={active ? "page" : undefined}
                  className="u-link t-label !text-bone/80 hover:!text-bone aria-[current=page]:!text-bone"
                >
                  {item.label}
                </Link>
              );
            })}
          </nav>

          <div className="flex items-center gap-6">
            <button
              type="button"
              className="t-label !text-bone md:hidden"
              aria-expanded={open}
              aria-controls="mobile-menu"
              onClick={() => setOpen((value) => !value)}
            >
              <span className="inline-flex items-center gap-2">
                <span aria-hidden className="relative block h-2.5 w-4">
                  <span className={`absolute left-0 top-0 h-px w-full bg-bone transition-transform duration-300 ${open ? "translate-y-[5px] rotate-45" : ""}`} />
                  <span className={`absolute bottom-0 left-0 h-px w-full bg-bone transition-transform duration-300 ${open ? "-translate-y-[4px] -rotate-45" : ""}`} />
                </span>
                {open ? "Close" : "Menu"}
              </span>
            </button>
          </div>
        </div>
      </header>

      <div
        id="mobile-menu"
        data-open={open}
        aria-hidden={!open}
        inert={!open}
        className={`fixed inset-0 z-40 bg-ink pt-24 transition-[opacity,visibility,transform] duration-500 ease-[var(--ease-out)] md:hidden ${
          open ? "visible translate-y-0 opacity-100" : "invisible -translate-y-3 opacity-0"
        }`}
      >
        <nav aria-label="Mobile" className="site-wrap flex h-full flex-col pb-10">
          <ul className="flex flex-col">
            {nav.map((item, index) => (
              <li key={item.href} className="menu-item border-b border-rule" style={{ "--i": index } as React.CSSProperties}>
                <Link href={item.href} className="flex items-baseline justify-between py-5 t-title">
                  {item.label}
                  <span className="t-label">0{index + 1}</span>
                </Link>
              </li>
            ))}
          </ul>
          <div className="menu-item mt-auto flex items-center justify-between" style={{ "--i": nav.length } as React.CSSProperties}>
            <Link href="/contact" className="btn btn-solid">
              Let&apos;s talk <span className="arrow">→</span>
            </Link>
          </div>
        </nav>
      </div>
    </>
  );
}
