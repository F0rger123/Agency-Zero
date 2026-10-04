import { Photo } from "./photo";

export type GlassItem = {
  src: string;
  alt: string;
  title: string;
  kind: string;
  width: number;
  height: number;
  /** Shown as a small tag, e.g. "Concept". */
  tag?: string;
};

/**
 * Liquid-glass carousel: frosted, softly lit panes drift from left to right in a seamless loop.
 *
 * Each pane is a glass bezel (blur + saturation, inner edge highlights, a diagonal specular sheen) around the
 * image, with a frosted caption bar. A blurred, saturated copy of the images glows behind the track so the
 * glass has something to refract. Pauses on hover/focus; with reduced motion it becomes a plain swipeable row.
 * Pure CSS (see `.glass-*` in globals.css); original implementation, no animation library.
 */
export function GlassCarousel({
  items,
  aspect = "16/10",
  seconds = 60,
  label,
}: {
  items: GlassItem[];
  /** CSS aspect-ratio of the image area, e.g. "16/10" or "4/5". */
  aspect?: string;
  /** Seconds for one full loop. */
  seconds?: number;
  label: string;
}) {
  const row = (hidden: boolean) => (
    <ul className="flex shrink-0 gap-6 pr-6 md:gap-8 md:pr-8" aria-hidden={hidden || undefined}>
      {items.map((item) => (
        <li key={`${hidden}-${item.title}`} className="glass-card shrink-0">
          <div className="glass-media" style={{ aspectRatio: aspect }}>
            <Photo src={item.src} alt={hidden ? "" : item.alt} width={item.width} height={item.height} className="size-full object-cover object-top" />
            <span className="glass-sheen" aria-hidden />
            {item.tag ? <span className="glass-tag t-label">{item.tag}</span> : null}
          </div>
          <div className="glass-caption">
            <p className="font-medium tracking-tight">{item.title}</p>
            <p className="t-label mt-1 !text-bone/70">{item.kind}</p>
          </div>
        </li>
      ))}
    </ul>
  );

  return (
    <div className="glass-carousel relative -mx-[var(--site-pad)] overflow-hidden py-12" role="region" aria-label={label}>
      <div className="glass-glow" aria-hidden>
        {items.slice(0, 3).map((item, index) => (
          <span key={item.title} style={{ backgroundImage: `url(${item.src})`, left: `${index * 34 - 6}%` }} />
        ))}
      </div>
      <div className="glass-track" style={{ "--glass-seconds": `${seconds}s` } as React.CSSProperties}>
        {row(false)}
        {row(true)}
      </div>
    </div>
  );
}
