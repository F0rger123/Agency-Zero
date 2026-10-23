import { Burst } from "@/components/animated-check";
import type { LockInMode } from "@/lib/lock-in";

export const MODE_INFO: Record<LockInMode, { title: string; blurb: string; start: string; badge: string }> = {
  stopwatch: { title: "Count up", blurb: "A stopwatch. Counts up until you stop it.", start: "Start timer", badge: "Counting up" },
  countdown: { title: "Countdown", blurb: "Pick a length. Counts down to zero.", start: "Start countdown", badge: "Counting down" },
  checklist: { title: "To-do list", blurb: "Work through a checklist. No clock.", start: "Start list", badge: "Working the list" },
  free: { title: "Just lock in", blurb: "No timer at all. Calm focus.", start: "Lock in", badge: "Locked in" },
};

/** Small drawing for each mode card. */
export function ModeGlyph({ mode, className = "size-8" }: { mode: LockInMode; className?: string }) {
  return (
    <svg viewBox="0 0 32 32" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" className={className} aria-hidden>
      {mode === "stopwatch" ? (
        <>
          <circle cx="16" cy="18" r="9" />
          <path d="M13 4.5h6M16 9v2.5" />
          <path d="M16 18l4-4" className="lock-in-glyph-hand" />
        </>
      ) : mode === "countdown" ? (
        <>
          <circle cx="16" cy="16" r="11" strokeDasharray="4 3" className="lock-in-glyph-spin" />
          <path d="M16 9v7l4.5 2.5" />
        </>
      ) : mode === "checklist" ? (
        <>
          <path d="M6 9l2.4 2.4L12.5 7M6 17l2.4 2.4 4.1-4.4M6 25h.01" />
          <path d="M17 9h9M17 17h9M17 25h9" />
        </>
      ) : (
        <>
          <circle cx="16" cy="16" r="3" className="fill-current" />
          <circle cx="16" cy="16" r="8" className="lock-in-glyph-pulse" />
          <circle cx="16" cy="16" r="12.5" className="lock-in-glyph-pulse lock-in-glyph-pulse-2" />
        </>
      )}
    </svg>
  );
}

/** A pill that always says what state the session is in, with a pulsing dot while it is live. */
export function LiveBadge({ mode, status }: { mode: LockInMode; status: "running" | "paused" | "done" }) {
  const text = status === "done" ? "Finished" : status === "paused" ? "Paused" : MODE_INFO[mode].badge;
  return (
    <span className="inline-flex items-center gap-2 rounded-full border border-border px-3.5 py-1.5 text-xs font-medium uppercase tracking-[0.2em] text-muted-foreground">
      <span aria-hidden className={`size-2 rounded-full bg-foreground ${status === "running" ? "lock-in-dot" : "opacity-40"}`} />
      {text}
    </span>
  );
}

/** Big clock text. The colon blinks while it runs, the whole thing softly fades when paused, and pulses when time is up. */
export function BigClock({ text, running, paused, alert, className = "text-[clamp(3.75rem,13vw,9rem)]" }: { text: string; running: boolean; paused: boolean; alert: boolean; className?: string }) {
  const parts = text.split(":");
  return (
    <p aria-live="off" aria-label={text} className={`shrink-0 ${className} font-semibold leading-none tabular-nums tracking-tight ${paused ? "lock-in-paused" : ""} ${alert ? "lock-in-alert" : ""}`}>
      {parts.map((part, index) => (
        <span key={index}>
          {index > 0 ? <span className={running ? "lock-in-colon" : ""}>:</span> : null}
          {part}
        </span>
      ))}
    </p>
  );
}

/** Checklist progress as a ring that fills as items are ticked, with a burst when the list is complete. */
export function ProgressRing({ done, total, className = "" }: { done: number; total: number; className?: string }) {
  const radius = 88;
  const circumference = 2 * Math.PI * radius;
  const fraction = total > 0 ? done / total : 0;
  const complete = total > 0 && done === total;
  return (
    <div className={`relative ${className}`}>
      <svg viewBox="0 0 200 200" role="img" aria-label={`${done} of ${total} done`} className={`size-full -rotate-90 ${complete ? "lock-in-alert" : ""}`}>
        <circle cx="100" cy="100" r={radius} fill="none" strokeWidth="10" className="stroke-muted" />
        <circle
          cx="100"
          cy="100"
          r={radius}
          fill="none"
          strokeWidth="10"
          strokeLinecap="round"
          className="stroke-foreground"
          strokeDasharray={circumference}
          strokeDashoffset={circumference * (1 - fraction)}
          style={{ transition: "stroke-dashoffset 0.7s cubic-bezier(0.22, 1, 0.36, 1)" }}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
        <span className="text-[clamp(3rem,9vw,5.5rem)] font-semibold leading-none tabular-nums tracking-tight">
          {done}
          <span className="text-muted-foreground">/{total}</span>
        </span>
        <span className="mt-2 text-xs uppercase tracking-[0.2em] text-muted-foreground">{total === 0 ? "Add items" : complete ? "All done" : "Done"}</span>
      </div>
      {complete ? <Burst key={`${total}`} size={3.4} /> : null}
    </div>
  );
}

/** A calm focus orb for the no-timer mode: rings that breathe outward while locked in. */
export function FocusOrb({ running, className = "" }: { running: boolean; className?: string }) {
  return (
    <div aria-hidden className={`relative flex items-center justify-center ${className}`}>
      {[0, 1, 2].map((index) => (
        <span key={index} className={`lock-in-orb-ring ${running ? "" : "lock-in-orb-still"}`} style={{ animationDelay: `${index * 1.3}s` }} />
      ))}
      <span className={`lock-in-orb-core ${running ? "" : "lock-in-orb-still"}`} />
    </div>
  );
}

/**
 * The session stage: a minute ring of 60 hairline ticks that fill in with the seconds, an arc for progress toward a goal
 * (or the time left in a countdown) with a small leading dot, and whatever you pass as children in the middle.
 * Everything moves smoothly (CSS transitions, no flashing) and sits still when the session is paused.
 */
export function TimerRing({
  fraction,
  seconds,
  className = "",
  children,
}: {
  /** 0 to 1 arc, or null for no arc. */
  fraction: number | null;
  /** 0 to 1 through the current minute, or null for no tick ring. */
  seconds: number | null;
  className?: string;
  children?: React.ReactNode;
}) {
  const radius = 96;
  const circumference = 2 * Math.PI * radius;
  const arc = fraction === null ? 0 : Math.min(1, Math.max(0, fraction));
  const lit = seconds === null ? 0 : Math.floor(seconds * 60);
  return (
    <div className={`lock-in-stage relative ${className}`}>
      <span aria-hidden className="lock-in-glow absolute inset-[-12%] rounded-full" />
      <svg viewBox="0 0 240 240" aria-hidden className="relative size-full">
        {Array.from({ length: 60 }, (_, index) => {
          const angle = (index / 60) * Math.PI * 2 - Math.PI / 2;
          const major = index % 5 === 0;
          const inner = major ? 108 : 111;
          return (
            <line
              key={index}
              x1={120 + Math.cos(angle) * inner}
              y1={120 + Math.sin(angle) * inner}
              x2={120 + Math.cos(angle) * 117}
              y2={120 + Math.sin(angle) * 117}
              strokeWidth={major ? 1.6 : 1}
              strokeLinecap="round"
              className={`transition-[stroke,opacity] duration-500 ${index < lit ? "stroke-foreground" : "stroke-foreground/15"}`}
            />
          );
        })}
        <circle cx="120" cy="120" r={radius} fill="none" strokeWidth="4" className="stroke-foreground/10" />
        {fraction !== null ? (
          <>
            <circle
              cx="120"
              cy="120"
              r={radius}
              fill="none"
              strokeWidth="4"
              strokeLinecap="round"
              className="stroke-foreground"
              strokeDasharray={circumference}
              strokeDashoffset={circumference * (1 - arc)}
              transform="rotate(-90 120 120)"
              style={{ transition: "stroke-dashoffset 1s linear" }}
            />
            <g style={{ transform: `rotate(${arc * 360}deg)`, transformOrigin: "120px 120px", transition: "transform 1s linear" }}>
              <circle cx="120" cy={120 - radius} r="5.5" className="fill-foreground" />
              <circle cx="120" cy={120 - radius} r="11" className="fill-foreground/10" />
            </g>
          </>
        ) : null}
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center px-[14%] text-center">{children}</div>
    </div>
  );
}

/** For the no-timer mode: three hairline rings that breathe slowly outward, with text in the middle. */
export function BreathRing({ running, className = "", children }: { running: boolean; className?: string; children?: React.ReactNode }) {
  return (
    <div className={`lock-in-stage relative ${className}`}>
      <span aria-hidden className="lock-in-glow absolute inset-[-12%] rounded-full" />
      <svg viewBox="0 0 240 240" aria-hidden className="relative size-full">
        <circle cx="120" cy="120" r="96" fill="none" strokeWidth="2.5" className="stroke-foreground/80" />
        {[0, 1, 2].map((index) => (
          <circle
            key={index}
            cx="120"
            cy="120"
            r="96"
            fill="none"
            strokeWidth="1.2"
            className={`stroke-foreground ${running ? "lock-in-breath" : "opacity-10"}`}
            style={{ animationDelay: `${index * 2.4}s`, transformOrigin: "120px 120px" }}
          />
        ))}
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center px-[14%] text-center">{children}</div>
    </div>
  );
}
