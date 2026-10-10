/**
 * The "zero" (a ring with a slash) drawn as strokes so it can animate. Used by the opening splash and the
 * in-app loader. Monochrome: it takes the current text colour.
 */
export function ZeroMark({ className = "size-16", draw = false, loop = false }: { className?: string; draw?: boolean; loop?: boolean }) {
  return (
    <svg viewBox="0 0 120 120" fill="none" stroke="currentColor" strokeWidth="5" strokeLinecap="round" aria-hidden className={className}>
      <ellipse cx="60" cy="60" rx="26" ry="38" pathLength={1} className={draw ? (loop ? "zero-ring zero-loop" : "zero-ring") : undefined} />
      <path d="M42 94L78 26" pathLength={1} className={draw ? (loop ? "zero-slash zero-loop" : "zero-slash") : undefined} />
    </svg>
  );
}
