"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Photo } from "./photo";

export type LensItem = { src: string; alt: string; title: string; kind: string; tag?: string };

/**
 * Liquid-glass lens carousel (inspired by the "liquid glass carousel" pattern: an infinite-feeling, snap-scrolling row of
 * images seen through a refracting glass lens, click to zoom). Original implementation, no WebGL or animation library:
 *
 *  - the row is a native scroll-snap container, so touch, trackpad and keyboard scrolling just work, plus drag with a mouse,
 *    arrow buttons and a slow auto-advance that stops as soon as you interact;
 *  - a glass lens is fixed at the centre. In Chromium it refracts and magnifies what passes under it (an SVG displacement
 *    filter used as a backdrop-filter, with red/green/blue split for the chromatic rim); elsewhere it falls back to a clear
 *    frosted ring, so nothing breaks;
 *  - the image behind the current slide glows softly in the background;
 *  - clicking a slide opens it large.
 */
const MAP =
  "data:image/svg+xml;utf8," +
  encodeURIComponent(
    `<svg xmlns='http://www.w3.org/2000/svg' width='256' height='256'><defs><linearGradient id='x' x1='0' x2='1' y1='0' y2='0'><stop offset='0' stop-color='#f00'/><stop offset='1' stop-color='#000'/></linearGradient><linearGradient id='y' x1='0' x2='0' y1='0' y2='1'><stop offset='0' stop-color='#0f0'/><stop offset='1' stop-color='#000'/></linearGradient></defs><rect width='256' height='256' fill='#000'/><rect width='256' height='256' fill='url(#x)'/><rect width='256' height='256' fill='url(#y)' style='mix-blend-mode:screen'/></svg>`,
  );

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
        const distance = Math.abs(slide.offsetLeft + slide.clientWidth / 2 - centre);
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
      {/* SVG filter used by the lens (Chromium refracts through it; other browsers ignore it) */}
      <svg width="0" height="0" className="absolute" aria-hidden focusable="false">
        <filter id="az-lens" x="0" y="0" width="100%" height="100%" colorInterpolationFilters="sRGB">
          <feImage href={MAP} x="0" y="0" width="100%" height="100%" preserveAspectRatio="none" result="map" />
          <feDisplacementMap in="SourceGraphic" in2="map" scale="36" xChannelSelector="R" yChannelSelector="G" result="dr" />
          <feColorMatrix in="dr" type="matrix" values="1 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 1 0" result="r" />
          <feDisplacementMap in="SourceGraphic" in2="map" scale="42" xChannelSelector="R" yChannelSelector="G" result="dg" />
          <feColorMatrix in="dg" type="matrix" values="0 0 0 0 0 0 1 0 0 0 0 0 0 0 0 0 0 0 1 0" result="g" />
          <feDisplacementMap in="SourceGraphic" in2="map" scale="48" xChannelSelector="R" yChannelSelector="G" result="db" />
          <feColorMatrix in="db" type="matrix" values="0 0 0 0 0 0 0 0 0 0 0 0 1 0 0 0 0 0 1 0" result="b" />
          <feBlend in="r" in2="g" mode="screen" result="rg" />
          <feBlend in="rg" in2="b" mode="screen" />
        </filter>
      </svg>

      <div className="lens-glow" aria-hidden>
        {items.map((item, index) => (
          <span key={item.title} style={{ backgroundImage: `url(${item.src})`, opacity: index === active ? 1 : 0 }} />
        ))}
      </div>

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

      <div className="lens" aria-hidden>
        <span className="lens-ring" />
      </div>

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
