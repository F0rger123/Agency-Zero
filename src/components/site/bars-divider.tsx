/**
 * Vertical-bars divider — a quiet pulse of thin bars used as an edge treatment
 * between sections (e.g. creative ↔ software). Heights follow a fixed wave;
 * a very slow staggered opacity animation gives it life. Pure CSS, low
 * contrast by design (the reference was too harsh for full-bleed use).
 */
export function BarsDivider({ flip = false, className = "" }: { flip?: boolean; className?: string }) {
  const bars = Array.from({ length: 64 }, (_, i) => {
    const wave = (Math.sin(i * 0.37) + Math.sin(i * 0.11 + 1.2) + 2) / 4; // 0..1
    return { h: 18 + wave * 82, delay: (i % 16) * 0.35 };
  });
  return (
    <div
      aria-hidden
      className={`pointer-events-none flex h-24 w-full items-end gap-[3px] overflow-hidden px-[var(--site-pad)] sm:h-32 ${
        flip ? "rotate-180" : ""
      } ${className}`}
    >
      {bars.map((bar, i) => (
        <span
          key={i}
          className="bars-pulse block flex-1 bg-bone/[0.1]"
          style={{ height: `${bar.h}%`, animationDelay: `${bar.delay}s` }}
        />
      ))}
    </div>
  );
}
