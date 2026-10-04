"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Photo } from "./photo";

export type LensItem = { src: string; alt: string; title: string; kind: string; tag?: string };

/**
 * Coverflow-style carousel: a native scroll-snap row (touch, trackpad, keyboard, mouse drag, arrow buttons, slow
 * auto-advance that stops on interaction). The centre slide faces you; slides on either side tilt away, shrink, fade and
 * blur as if flowing in from the edges. Each slide gets `--o` (signed distance from centre in slide widths) and `--a`
 * (its absolute value, capped) on scroll, and CSS does the rest. Clicking the centre slide opens it large.
 */
export function LensCarousel({ items, label }: { items: LensItem[]; label: string }) {
  const track = useRef<HTMLUListElement>(null);
  const [active, setActive] = useState(0);
  const [zoom, setZoom] = useState<number | null>(null);
  const [zoomVisible, setZoomVisible] = useState(false);
  const interacted = useRef(false);
  const drag = useRef<{ x: number; left: number; moved: boolean } | null>(null);

  const go = useCallback(
    (index: number) => {
      const node = track.current;
      if (!node) return;
      const next = (index + items.length) % items.length;
      const slide = node.children[next] as HTMLElement | undefined;
      if (slide) node.scrollTo({ left: slide.offsetLeft - (node.clientWidth - slide.clientWidth) / 2, behavior: "smooth" });
    },
    [items.length],
  );

  // Track which slide is nearest the centre.
  useEffect(() => {
    const node = track.current;
    if (!node) return;
    let frame = 0;
    const update = () => {
      frame = 0;
      const centre = node.scrollLeft + node.clientWidth / 2;
      let best = 0;
      let bestDistance = Infinity;
      Array.from(node.children).forEach((child, index) => {
        const slide = child as HTMLElement;
        const signed = (slide.offsetLeft + slide.clientWidth / 2 - centre) / slide.clientWidth;
        const distance = Math.abs(signed);
        slide.style.setProperty("--o", Math.max(-2.5, Math.min(2.5, signed)).toFixed(3));
        slide.style.setProperty("--a", Math.min(distance, 2).toFixed(3));
        if (distance < bestDistance) {
          bestDistance = distance;
          best = index;
        }
      });
      setActive(best);
    };
    const onScroll = () => {
      if (!frame) frame = requestAnimationFrame(update);
    };
    update();
    node.addEventListener("scroll", onScroll, { passive: true });
    return () => {
      node.removeEventListener("scroll", onScroll);
      if (frame) cancelAnimationFrame(frame);
    };
  }, []);

  // Gentle auto-advance until the visitor touches anything; never under reduced motion.
  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const timer = window.setInterval(() => {
      if (!interacted.current && document.visibilityState === "visible") go(active + 1);
    }, 5200);
    return () => window.clearInterval(timer);
  }, [active, go]);

  const closeZoom = useCallback(() => {
    setZoomVisible(false);
    window.setTimeout(() => setZoom(null), 350);
  }, []);

  // Lightbox: fade/scale in, Escape closes.
  useEffect(() => {
    if (zoom === null) return;
    const frame = requestAnimationFrame(() => setZoomVisible(true));
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") closeZoom();
    };
    window.addEventListener("keydown", onKey);
    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener("keydown", onKey);
    };
  }, [zoom, closeZoom]);

  const touch = () => {
    interacted.current = true;
  };

  return (
    <div className="lens-carousel relative -mx-[var(--site-pad)] py-10" role="region" aria-roledescription="carousel" aria-label={label}>
      <ul
        ref={track}
        className="lens-track"
        tabIndex={0}
        aria-label={`${label}, use the arrow keys or buttons to move`}
        onKeyDown={(event) => {
          if (event.key === "ArrowRight") {
            event.preventDefault();
            touch();
            go(active + 1);
          }
          if (event.key === "ArrowLeft") {
            event.preventDefault();
            touch();
            go(active - 1);
          }
        }}
        onPointerEnter={touch}
        onPointerDown={(event) => {
          touch();
          if (event.pointerType !== "mouse" || !track.current) return;
          drag.current = { x: event.clientX, left: track.current.scrollLeft, moved: false };
          track.current.classList.add("is-dragging");
        }}
        onPointerMove={(event) => {
          const state = drag.current;
          if (!state || !track.current) return;
          const delta = event.clientX - state.x;
          if (Math.abs(delta) > 4) state.moved = true;
          track.current.scrollLeft = state.left - delta;
        }}
        onPointerUp={() => {
          if (!track.current) return;
          track.current.classList.remove("is-dragging");
          window.setTimeout(() => {
            drag.current = null;
          }, 0);
        }}
        onPointerLeave={() => {
          track.current?.classList.remove("is-dragging");
          drag.current = null;
        }}
      >
        {items.map((item, index) => (
          <li key={item.title} className="lens-slide" aria-roledescription="slide" aria-label={`${index + 1} of ${items.length}: ${item.title}`}>
            <button
              type="button"
              className="lens-card"
              data-active={index === active}
              onClick={() => {
                if (drag.current?.moved) return;
                touch();
                if (index !== active) go(index);
                else setZoom(index);
              }}
              aria-label={index === active ? `Open ${item.title} larger` : `Show ${item.title}`}
            >
              <Photo src={item.src} alt={item.alt} width={2160} height={1350} className="lens-img" />
              {item.tag ? <span className="lens-tag t-label">{item.tag}</span> : null}
            </button>
            <div className="lens-caption">
              <p className="font-medium tracking-tight">{item.title}</p>
              <p className="t-label mt-1">{item.kind}</p>
            </div>
          </li>
        ))}
      </ul>

      <div className="mt-6 flex items-center justify-center gap-5">
        <button type="button" className="lens-btn" aria-label="Previous design" onClick={() => { touch(); go(active - 1); }}>
          ←
        </button>
        <ol className="flex items-center gap-2" aria-hidden>
          {items.map((item, index) => (
            <li key={item.title}>
              <button type="button" tabIndex={-1} onClick={() => { touch(); go(index); }} className={`lens-dot ${index === active ? "is-on" : ""}`} />
            </li>
          ))}
        </ol>
        <button type="button" className="lens-btn" aria-label="Next design" onClick={() => { touch(); go(active + 1); }}>
          →
        </button>
      </div>

      {zoom !== null ? (
        <div
          role="dialog"
          aria-modal="true"
          aria-label={items[zoom].title}
          className={`fixed inset-0 z-[90] grid place-items-center bg-black/80 p-4 backdrop-blur-md transition-opacity duration-300 md:p-10 ${zoomVisible ? "opacity-100" : "opacity-0"}`}
          onClick={closeZoom}
        >
          <figure className={`max-w-6xl transition-transform duration-500 ease-[var(--ease-out)] ${zoomVisible ? "scale-100" : "scale-90"}`} onClick={(event) => event.stopPropagation()}>
            <Photo src={items[zoom].src} alt={items[zoom].alt} width={2160} height={1350} className="max-h-[78vh] w-auto border border-rule-strong" />
            <figcaption className="mt-4 flex items-center justify-between gap-6">
              <span>
                <span className="font-medium">{items[zoom].title}</span>
                <span className="t-label ml-4">{items[zoom].kind}</span>
              </span>
              <button type="button" className="lens-btn" aria-label="Close" onClick={closeZoom}>✕</button>
            </figcaption>
          </figure>
        </div>
      ) : null}
    </div>
  );
}
