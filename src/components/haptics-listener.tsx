"use client";

import { useEffect } from "react";
import { haptic } from "@/lib/haptics";

const TAPPABLE = 'button:not(:disabled), a[href], [role="checkbox"], [role="radio"], [role="tab"], [role="switch"], summary, input[type="checkbox"], input[type="radio"]';

/** A light tick for every tap on something tappable, on touch screens only. Specific actions add stronger feedback themselves. */
export function HapticsListener() {
  useEffect(() => {
    let lastTouch = 0;
    const onDown = (event: PointerEvent) => {
      if (event.pointerType === "touch" || event.pointerType === "pen") lastTouch = performance.now();
    };
    const onClick = (event: MouseEvent) => {
      if (performance.now() - lastTouch > 800) return;
      const target = event.target as Element | null;
      if (!target || target.closest("[data-no-haptic]") || !target.closest(TAPPABLE)) return;
      haptic("light");
    };
    document.addEventListener("pointerdown", onDown, { capture: true, passive: true });
    document.addEventListener("click", onClick, { capture: true });
    return () => {
      document.removeEventListener("pointerdown", onDown, { capture: true });
      document.removeEventListener("click", onClick, { capture: true });
    };
  }, []);
  return null;
}
