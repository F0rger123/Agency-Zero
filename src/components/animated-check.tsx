"use client";

import { useState } from "react";
import { haptic } from "@/lib/haptics";

const PIECES = Array.from({ length: 10 }, (_, index) => ({ angle: index * 36, distance: index % 2 === 0 ? 24 : 16 }));

/** The pieces of a celebration burst. Decorative only. */
export function Burst({ size = 1 }: { size?: number }) {
  return (
    <span className="az-burst" aria-hidden>
      {PIECES.map((piece) => (
        <i key={piece.angle} style={{ "--a": `${piece.angle}deg`, "--d": `${piece.distance * size}px` } as React.CSSProperties} />
      ))}
    </span>
  );
}

/**
 * A checkbox that celebrates: the box pops, the tick draws itself and a small burst flies out.
 * The animation only plays when you tick it, never for items that were already done when the page opened.
 */
export function AnimatedCheck({
  checked,
  onChange,
  label,
  className = "size-6",
}: {
  checked: boolean;
  onChange: (next: boolean) => void;
  label: string;
  className?: string;
}) {
  const [plays, setPlays] = useState(0);
  return (
    <button
      type="button"
      role="checkbox"
      aria-checked={checked}
      aria-label={label}
      data-no-haptic
      onClick={() => {
        if (!checked) setPlays((value) => value + 1);
        haptic(checked ? "light" : "success");
        onChange(!checked);
      }}
      className={`press relative inline-flex shrink-0 items-center justify-center rounded-full ${className}`}
    >
      <svg viewBox="0 0 24 24" className={`size-full ${checked && plays > 0 ? "az-check-pop" : ""}`} fill="none" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="10" strokeWidth="1.6" className={`transition-colors duration-200 ${checked ? "fill-foreground stroke-foreground" : "stroke-foreground/50 hover:stroke-foreground"}`} />
        {checked ? <path d="M7.5 12.5l3 3 6-6.5" strokeWidth="2.2" className={`stroke-background ${plays > 0 ? "az-check-draw" : ""}`} /> : null}
      </svg>
      {checked && plays > 0 ? <Burst key={plays} /> : null}
    </button>
  );
}
