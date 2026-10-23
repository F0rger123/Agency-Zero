/**
 * Hourglass drawn in SVG. `progress` is 0 (all sand on top) to 1 (all sand at the bottom).
 * Sand has a dipped surface up top and a heaped mound below; while `running` a thin stream and falling grains animate
 * between the bulbs and the glass breathes softly. `celebrate` adds a gentle pulse once a goal is reached.
 * Everything holds still under reduced motion.
 */
const GLASS = "M24 12 H96 C96 52 68 78 66 100 C68 122 96 148 96 188 H24 C24 148 52 122 54 100 C52 78 24 52 24 12 Z";

export function Hourglass({
  progress,
  running,
  celebrate = false,
  className = "",
}: {
  progress: number;
  running: boolean;
  celebrate?: boolean;
  className?: string;
}) {
  const p = Math.min(1, Math.max(0, progress));
  const topLevel = 100 - 80 * (1 - p); // surface of the sand up top (smaller y = fuller)
  const dip = 5 * (1 - p) + 1; // the surface sinks toward the middle as it drains
  const heap = 70 * p; // how tall the mound below is at its peak
  const mound = 188 - heap;
  const flowing = running && p < 1 && p > 0;
  return (
    <svg
      viewBox="0 0 120 200"
      role="img"
      aria-label={`Hourglass, ${Math.round(p * 100)} percent of the time used`}
      className={`${className} ${running ? "lock-in-breathe" : ""} ${celebrate ? "lock-in-celebrate" : ""}`}
    >
      <defs>
        <clipPath id="lock-in-glass">
          <path d={GLASS} />
        </clipPath>
      </defs>
      <path d={GLASS} className="fill-foreground/[0.05]" />
      <g clipPath="url(#lock-in-glass)" className="fill-foreground">
        {/* Sand up top: flat sides, surface dipping toward the centre. */}
        <path d={`M0 ${topLevel + 2} Q60 ${topLevel + 2 + dip * 2} 120 ${topLevel + 2} V104 H0 Z`} />
        {/* Sand below: a mound that grows from the floor. */}
        {p > 0 ? <path d={`M0 190 V${188 - heap * 0.45} Q60 ${mound - heap * 0.35} 120 ${188 - heap * 0.45} V190 Z`} /> : null}
      </g>
      {flowing ? (
        <>
          <line x1="60" y1="98" x2="60" y2={mound + 2} strokeWidth="1.6" strokeLinecap="round" className="lock-in-stream stroke-foreground" />
        </>
      ) : null}
      {/* A soft highlight along the left of each bulb, and the outline. */}
      <path d="M31 22 C32 48 48 66 56 84 M31 178 C32 156 44 140 52 124" fill="none" strokeWidth="2" strokeLinecap="round" className="stroke-background/70" />
      <path d={GLASS} fill="none" strokeWidth="2.6" strokeLinejoin="round" className="stroke-foreground" />
      <rect x="14" y="3" width="92" height="9" rx="4.5" className="fill-foreground" />
      <rect x="14" y="188" width="92" height="9" rx="4.5" className="fill-foreground" />
    </svg>
  );
}
