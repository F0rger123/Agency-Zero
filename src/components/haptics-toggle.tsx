"use client";

import { useState } from "react";
import { haptic, hapticsEnabled, setHapticsEnabled } from "@/lib/haptics";

/** "Vibrate on taps" switch for phones (in the menu). Hidden on devices without touch. */
export function HapticsToggle() {
  const [on, setOn] = useState(() => hapticsEnabled());
  const [touch] = useState(() => typeof window !== "undefined" && window.matchMedia("(pointer: coarse)").matches);
  if (!touch) return null;
  return (
    <label className="mt-5 flex items-center justify-between gap-4 rounded-xl border border-border px-4 py-3 text-sm">
      <span>
        <span className="block font-medium">Vibrate on taps</span>
        <span className="block text-xs text-muted-foreground">A light tick when you tap buttons and tick things off.</span>
      </span>
      <input
        type="checkbox"
        role="switch"
        checked={on}
        data-no-haptic
        onChange={(event) => {
          setOn(event.target.checked);
          setHapticsEnabled(event.target.checked);
          if (event.target.checked) haptic("medium");
        }}
        className="size-5 accent-foreground"
      />
    </label>
  );
}
