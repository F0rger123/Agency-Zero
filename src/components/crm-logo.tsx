/**
 * The CRM mark: a black tile holding a "zero" (ring with a slash). Drawn in SVG so it is crisp at any size
 * and inherits the theme (currentColor).
 */
export function CrmMark({ className = "size-9" }: { className?: string }) {
  return (
    <svg viewBox="0 0 40 40" aria-hidden className={className}>
      <rect width="40" height="40" rx="10" className="fill-foreground" />
      <ellipse cx="20" cy="20" rx="7.5" ry="10.5" fill="none" strokeWidth="3" className="stroke-background" />
      <path d="M13.5 28.5L26.5 11.5" strokeWidth="2.6" strokeLinecap="round" className="stroke-background" />
    </svg>
  );
}

export function CrmLogo() {
  return (
    <span className="flex items-center gap-3">
      <CrmMark />
      <span className="flex flex-col leading-none">
        <span className="text-[17px] font-semibold tracking-tight">Agency Zero</span>
        <span className="mt-1 hidden text-[10px] font-medium uppercase tracking-[0.28em] text-muted-foreground sm:block">Command center</span>
      </span>
    </span>
  );
}
