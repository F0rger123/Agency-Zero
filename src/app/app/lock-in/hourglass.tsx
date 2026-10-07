/**
 * Hourglass drawn in SVG. `progress` is 0 (all sand on top) to 1 (all sand at the bottom).
 * The stream between the bulbs only runs while `running`, and holds still under reduced motion.
 */
const GLASS = "M22 10 H98 C98 55 66 80 66 100 C66 120 98 145 98 190 H22 C22 145 54 120 54 100 C54 80 22 55 22 10 Z";

export function Hourglass({ progress, running, className = "" }: { progress: number; running: boolean; className?: string }) {
  const p = Math.min(1, Math.max(0, progress));
  const topHeight = 90 * (1 - p);
  const bottomHeight = 90 * p;
  const streamEnd = 190 - bottomHeight;
  const flowing = running && p < 1 && p > 0;
  return (
    <svg viewBox="0 0 120 200" role="img" aria-label={`Hourglass, ${Math.round(p * 100)} percent of the time used`} className={className}>
      <defs>
        <clipPath id="lock-in-glass">
          <path d={GLASS} />
        </clipPath>
      </defs>
      <g clipPath="url(#lock-in-glass)" className="fill-foreground">
        <rect x="0" y={100 - topHeight} width="120" height={topHeight} />
        <rect x="0" y={190 - bottomHeight} width="120" height={bottomHeight} />
      </g>
      {flowing ? (
        <line x1="60" y1="98" x2="60" y2={streamEnd} strokeWidth="1.6" strokeLinecap="round" className="lock-in-stream stroke-foreground" />
      ) : null}
      <path d={GLASS} fill="none" strokeWidth="3" strokeLinejoin="round" className="stroke-foreground" />
      <path d="M14 10 H106 M14 190 H106" strokeWidth="5" strokeLinecap="round" className="stroke-foreground" />
    </svg>
  );
}
