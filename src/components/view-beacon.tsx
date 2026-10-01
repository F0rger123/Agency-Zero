"use client";

import { useEffect } from "react";

/**
 * Records that a human opened a public link (quote/contract).
 *
 * Marking "viewed" used to happen while rendering the page, so link
 * previewers, email scanners and prefetchers flipped quotes to "viewed".
 * Now it only fires from a real browser: after a few seconds of the tab being
 * visible, or on the first pointer/scroll/key interaction — whichever is first.
 * `markViewed` is a server action; failures are intentionally ignored (view
 * tracking must never break the customer-facing page).
 */
export function ViewBeacon({ markViewed }: { markViewed: () => Promise<void> }) {
  useEffect(() => {
    let sent = false;
    const fire = () => {
      if (sent) return;
      sent = true;
      cleanup();
      markViewed().catch(() => undefined);
    };
    const events = ["pointerdown", "scroll", "keydown", "touchstart"] as const;
    const timer = window.setTimeout(() => {
      if (document.visibilityState === "visible") fire();
    }, 4000);
    function cleanup() {
      window.clearTimeout(timer);
      events.forEach((name) => window.removeEventListener(name, fire));
    }
    events.forEach((name) => window.addEventListener(name, fire, { passive: true, once: true }));
    return cleanup;
  }, [markViewed]);

  return null;
}
