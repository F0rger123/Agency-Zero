/**
 * Slow, quiet marquee strip of disciplines. Pure CSS; pauses on hover; static under reduced motion.
 * The list is duplicated once so the loop is seamless; the copy is hidden from assistive tech.
 */
export function Marquee({ items }: { items: readonly string[] }) {
  const row = (hidden: boolean) => (
    <ul className="flex shrink-0 items-center" aria-hidden={hidden || undefined}>
      {items.map((item) => (
        <li key={`${hidden}-${item}`} className="flex items-center">
          <span className="t-title !text-[clamp(1.4rem,3vw,2.4rem)] px-8 text-bone/80">{item}</span>
          <span className="size-1.5 rounded-full bg-bone/30" aria-hidden />
        </li>
      ))}
    </ul>
  );
  return (
    <div className="marquee overflow-hidden border-y border-rule py-6" role="presentation">
      <div className="marquee-track">
        {row(false)}
        {row(true)}
      </div>
    </div>
  );
}
