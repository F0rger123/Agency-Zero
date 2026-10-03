import Link from "next/link";

/** AGENCY ZER0 — the 0 is quietly dimmer; that is the whole identity trick. */
export function SiteWordmark({ className = "" }: { className?: string }) {
  return (
    <Link
      href="/"
      aria-label="Agency Zero — home"
      className={`inline-flex items-baseline gap-[0.45em] text-[0.95rem] font-semibold uppercase tracking-[0.2em] ${className}`}
    >
      <span>Agency</span>
      <span>
        Zer<span className="text-bone/50">0</span>
      </span>
    </Link>
  );
}
