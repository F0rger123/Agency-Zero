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
export function BigClock({ text, running, paused, alert }: { text: string; running: boolean; paused: boolean; alert: boolean }) {
  const parts = text.split(":");
  return (
    <p aria-live="off" aria-label={text} className={`shrink-0 text-[clamp(3.75rem,13vw,9rem)] font-semibold leading-none tabular-nums tracking-tight ${paused ? "lock-in-paused" : ""} ${alert ? "lock-in-alert" : ""}`}>
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
