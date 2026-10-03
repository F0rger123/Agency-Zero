"use client";

import { useEffect, useRef, type ElementType, type ReactNode } from "react";

/**
 * Scroll-linked CSS variables without React re-renders.
 *
 * Writes two custom properties on the element, updated at most once per frame
 * and only while the element is near the viewport:
 *   --p  0 → 1 as the element travels from entering the bottom of the viewport
 *        to leaving the top ("pass" progress)
 *   --s  0 → 1 across the sticky range (element taller than the viewport):
 *        0 when its top reaches the viewport top, 1 when its bottom reaches the
 *        viewport bottom ("sticky" progress)
 *
 * Children animate purely in CSS with `calc(var(--p) * …)`, which keeps the
 * work on the compositor. Under reduced motion both stay at their rest values
 * (--p: 0.5, --s: 0.5) and nothing moves.
 */
export function ScrollScene({
  children,
  className = "",
  as: Tag = "div",
}: {
  children: ReactNode;
  className?: string;
  as?: ElementType;
}) {
  const ref = useRef<HTMLElement>(null);

  useEffect(() => {
    const node = ref.current;
    if (!node) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      node.style.setProperty("--p", "0.5");
      node.style.setProperty("--s", "0.5");
      return;
    }

    let raf = 0;
    let near = false;
    const clamp = (n: number) => Math.min(1, Math.max(0, n));

    const update = () => {
      raf = 0;
      const rect = node.getBoundingClientRect();
      const vh = window.innerHeight;
      node.style.setProperty("--p", clamp((vh - rect.top) / (vh + rect.height)).toFixed(4));
      const range = rect.height - vh;
      node.style.setProperty("--s", range > 0 ? clamp(-rect.top / range).toFixed(4) : "0");
    };
    const schedule = () => {
      if (near && !raf) raf = requestAnimationFrame(update);
    };

    const io = new IntersectionObserver(
      ([entry]) => {
        near = entry.isIntersecting;
        if (near) schedule();
      },
      { rootMargin: "20% 0px 20% 0px" }
    );
    io.observe(node);
    window.addEventListener("scroll", schedule, { passive: true });
    window.addEventListener("resize", schedule, { passive: true });
    update();

    return () => {
      io.disconnect();
      window.removeEventListener("scroll", schedule);
      window.removeEventListener("resize", schedule);
      if (raf) cancelAnimationFrame(raf);
    };
  }, []);

  return (
    <Tag ref={ref} className={className} style={{ "--p": 0, "--s": 0 } as React.CSSProperties}>
      {children}
    </Tag>
  );
}
