"use client";

import { useEffect, useRef } from "react";

/**
 * Layered text — signature moment #3 (used once, in the closing statement).
 *
 * The word is stacked in N depth layers (front layer solid and real text, rear
 * layers outlined, aria-hidden). The pointer tilts the stack, so the layers
 * fan out in parallax like physical cut-outs. Under reduced motion / touch the
 * stack rests in a gentle fixed offset. Original CSS-3D implementation (the
 * reference depends on GSAP).
 */
export function LayeredText({ text, className = "", layers = 6 }: { text: string; className?: string; layers?: number }) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const node = ref.current;
    if (!node) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const section = node.closest("section") ?? node;
    let raf = 0;
    let tx = 0;
    let ty = 0;
    let cx = 0;
    let cy = 0;
    const loop = () => {
      cx += (tx - cx) * 0.08;
      cy += (ty - cy) * 0.08;
      node.style.setProperty("--px", cx.toFixed(3));
      node.style.setProperty("--py", cy.toFixed(3));
      raf = Math.abs(tx - cx) + Math.abs(ty - cy) > 0.001 ? requestAnimationFrame(loop) : 0;
    };
    const onMove = (event: PointerEvent) => {
      const rect = section.getBoundingClientRect();
      tx = ((event.clientX - rect.left) / rect.width - 0.5) * 2;
      ty = ((event.clientY - rect.top) / rect.height - 0.5) * 2;
      if (!raf) raf = requestAnimationFrame(loop);
    };
    section.addEventListener("pointermove", onMove, { passive: true });
    return () => {
      section.removeEventListener("pointermove", onMove);
      if (raf) cancelAnimationFrame(raf);
    };
  }, []);

  return (
    <div
      ref={ref}
      className={`relative inline-block [perspective:1200px] ${className}`}
      style={{ "--px": 0.35, "--py": -0.2 } as React.CSSProperties}
    >
      <div className="relative [transform-style:preserve-3d]">
        {Array.from({ length: layers }, (_, i) => {
          const depth = layers - 1 - i; // 0 = front
          const isFront = depth === 0;
          return (
            <span
              key={i}
              aria-hidden={!isFront}
              className={`block whitespace-nowrap ${isFront ? "relative text-bone" : "absolute inset-0 text-transparent"}`}
              style={{
                WebkitTextStroke: isFront ? undefined : `1px rgb(255 255 255 / ${0.1 + (1 - depth / layers) * 0.3})`,
                transform: `translate3d(calc(var(--px) * ${depth * -9}px), calc(var(--py) * ${depth * -7}px), ${depth * -34}px)`,
              }}
            >
              {text}
            </span>
          );
        })}
      </div>
    </div>
  );
}
