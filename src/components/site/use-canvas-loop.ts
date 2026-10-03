"use client";

import { useEffect, useRef, type RefObject } from "react";

/**
 * Background visuals yield to scrolling: while the page is being scrolled (and
 * for a short moment after) canvas frames are skipped, so scrolling only costs
 * compositor work. One shared listener for every canvas on the page.
 */
let lastScrollAt = 0;
let scrollListening = false;
function trackScroll() {
  if (scrollListening || typeof window === "undefined") return;
  scrollListening = true;
  window.addEventListener(
    "scroll",
    () => {
      lastScrollAt = performance.now();
    },
    { passive: true }
  );
}
const SCROLL_QUIET_MS = 140;

/**
 * Runs `frame` on requestAnimationFrame ONLY while the canvas is on screen and
 * the tab is visible (performance rule for every interactive visual on the
 * site). `fps` caps the frame rate. Under `prefers-reduced-motion` the loop
 * never starts; `onStatic` is called once instead so the component can paint a
 * still frame.
 */
export function useCanvasLoop(
  target: RefObject<HTMLElement | null>,
  frame: (dt: number, time: number) => void,
  options: { fps?: number; onStatic?: () => void; pauseOnScroll?: boolean } = {}
) {
  const frameRef = useRef(frame);
  const staticRef = useRef(options.onStatic);
  useEffect(() => {
    frameRef.current = frame;
    staticRef.current = options.onStatic;
  });

  const fps = options.fps ?? 60;
  const pauseOnScroll = options.pauseOnScroll ?? true;

  useEffect(() => {
    const node = target.current;
    if (!node) return;

    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduced) {
      staticRef.current?.();
      return;
    }

    trackScroll();
    let raf = 0;
    let last = 0;
    let onScreen = false;
    let tabVisible = document.visibilityState === "visible";
    const minDelta = 1000 / fps;

    const tick = (now: number) => {
      raf = requestAnimationFrame(tick);
      const dt = now - last;
      if (dt < minDelta) return;
      if (pauseOnScroll && now - lastScrollAt < SCROLL_QUIET_MS) {
        last = now; // keep dt small after the pause so simulations don't jump
        return;
      }
      last = now;
      frameRef.current(dt, now);
    };
    const sync = () => {
      const shouldRun = onScreen && tabVisible;
      if (shouldRun && !raf) {
        last = 0;
        raf = requestAnimationFrame(tick);
      } else if (!shouldRun && raf) {
        cancelAnimationFrame(raf);
        raf = 0;
      }
    };

    const io = new IntersectionObserver(
      ([entry]) => {
        onScreen = entry.isIntersecting;
        sync();
      },
      { threshold: 0 }
    );
    io.observe(node);
    const onVisibility = () => {
      tabVisible = document.visibilityState === "visible";
      sync();
    };
    document.addEventListener("visibilitychange", onVisibility);

    return () => {
      io.disconnect();
      document.removeEventListener("visibilitychange", onVisibility);
      if (raf) cancelAnimationFrame(raf);
    };
  }, [target, fps, pauseOnScroll]);
}
