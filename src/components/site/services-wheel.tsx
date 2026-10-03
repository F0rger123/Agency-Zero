"use client";

import Link from "next/link";
import { useCallback, useRef, useState, type KeyboardEvent, type PointerEvent } from "react";
import { services } from "@/lib/site-config";
import { ServiceGlyph } from "./service-glyph";

/**
 * Signature moment #2 — the services wheel.
 *
 * Interpreted from the "works wheel" idea: a ring of services you rotate by
 * dragging, clicking, or using the arrow keys, with the selected service's
 * full explanation in a fixed panel beside it. The wheel is the navigator, the
 * panel is the content — so the six services are readable at once and nothing
 * essential hides behind the interaction. It never hijacks page scrolling.
 *
 * Below `md` the wheel is replaced by a plain list (all six, fully visible).
 */
const STEP = 360 / services.length;
/** The selected service rests at 3 o'clock, facing its description panel. */
const FACE = 90;

export function ServicesWheel() {
  const [active, setActive] = useState(0);
  const [turns, setTurns] = useState(0); // accumulated so the ring never spins backwards the long way
  const drag = useRef<{ x: number; moved: boolean } | null>(null);

  const go = useCallback((target: number) => {
    setActive((current) => {
      const n = services.length;
      const next = ((target % n) + n) % n;
      let delta = next - current;
      if (delta > n / 2) delta -= n;
      if (delta < -n / 2) delta += n;
      setTurns((t) => t + delta);
      return next;
    });
  }, []);

  const onPointerDown = (event: PointerEvent<HTMLDivElement>) => {
    drag.current = { x: event.clientX, moved: false };
  };
  const onPointerMove = (event: PointerEvent<HTMLDivElement>) => {
    const d = drag.current;
    if (!d) return;
    const dx = event.clientX - d.x;
    if (Math.abs(dx) > 56) {
      d.moved = true;
      d.x = event.clientX;
      go(active + (dx < 0 ? 1 : -1));
    }
  };
  const endDrag = () => {
    drag.current = null;
  };
  const onKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    if (event.key === "ArrowRight" || event.key === "ArrowDown") {
      event.preventDefault();
      go(active + 1);
    } else if (event.key === "ArrowLeft" || event.key === "ArrowUp") {
      event.preventDefault();
      go(active - 1);
    }
  };

  const current = services[active];

  return (
    <>
      {/* Wheel (md+) */}
      <div className="hidden items-center gap-10 md:grid md:grid-cols-12 lg:gap-16">
        <div className="md:col-span-6">
          <div
            role="group"
            aria-label="Services — use arrow keys or drag to rotate"
            tabIndex={0}
            onKeyDown={onKeyDown}
            onPointerDown={onPointerDown}
            onPointerMove={onPointerMove}
            onPointerUp={endDrag}
            onPointerLeave={endDrag}
            className="relative mx-auto aspect-square w-full max-w-[640px] cursor-grab touch-pan-y select-none [container-type:inline-size] active:cursor-grabbing"
          >
            {/* ring */}
            <div className="absolute inset-[7%] rounded-full border border-rule" aria-hidden />
            <div className="absolute inset-[22%] rounded-full border border-rule/60" aria-hidden />
            <div
              className="absolute inset-0 transition-transform duration-[1100ms] ease-[var(--ease-out)]"
              style={{ transform: `rotate(${FACE - turns * STEP}deg)` }}
            >
              {services.map((service, i) => {
                const angle = i * STEP;
                const isActive = i === active;
                return (
                  <div
                    key={service.slug}
                    className="absolute left-1/2 top-1/2"
                    style={{ transform: `rotate(${angle}deg) translateY(-43cqw)` }}
                  >
                    <button
                      type="button"
                      onClick={() => {
                        if (!drag.current?.moved) go(i);
                      }}
                      aria-pressed={isActive}
                      className="flex -translate-x-1/2 -translate-y-1/2 flex-col items-center gap-2 transition-transform duration-[1100ms] ease-[var(--ease-out)]"
                      style={{ transform: `translate(-50%, -50%) rotate(${-(angle + FACE - turns * STEP)}deg)` }}
                    >
                      <span
                        className={`block rounded-full transition-all duration-500 ${
                          isActive ? "size-3 bg-bone" : "size-1.5 bg-ash"
                        }`}
                      />
                      <span
                        className={`font-mono text-[0.72rem] uppercase tracking-[0.16em] transition-colors duration-500 ${
                          isActive ? "text-bone" : "text-ash hover:text-mist"
                        }`}
                      >
                        {service.short}
                      </span>
                    </button>
                  </div>
                );
              })}
            </div>

            {/* centre */}
            <div className="absolute inset-[30%] flex flex-col items-center justify-center text-bone">
              <ServiceGlyph slug={current.slug} className="size-[46%] opacity-90" />
              <span className="t-label mt-5">{current.index} / 0{services.length}</span>
            </div>
          </div>

          <div className="mt-6 flex items-center justify-center gap-6">
            <button type="button" onClick={() => go(active - 1)} className="btn !h-11 !px-5" aria-label="Previous service">
              ←
            </button>
            <button type="button" onClick={() => go(active + 1)} className="btn !h-11 !px-5" aria-label="Next service">
              →
            </button>
          </div>
        </div>

        <div className="md:col-span-6" aria-live="polite">
          <p className="t-label">{current.index} — Service</p>
          <h3 className="t-title mt-5">{current.title}</h3>
          <p className="t-lead mt-6 max-w-lg">{current.summary}</p>
          <ul className="mt-8 max-w-lg divide-y divide-rule border-y border-rule">
            {current.points.map((point) => (
              <li key={point} className="flex items-baseline gap-4 py-3 text-sm text-mist">
                <span className="text-ash">—</span>
                {point}
              </li>
            ))}
          </ul>
          <Link href={`/services/${current.slug}`} className="btn mt-10">
            Explore {current.short} <span className="arrow" aria-hidden>→</span>
          </Link>
        </div>
      </div>

      {/* List (below md): everything visible, nothing to operate */}
      <ul className="divide-y divide-rule border-y border-rule md:hidden">
        {services.map((service) => (
          <li key={service.slug}>
            <Link href={`/services/${service.slug}`} className="block py-7">
              <div className="flex items-start justify-between gap-6">
                <div>
                  <p className="t-label">{service.index}</p>
                  <h3 className="t-title mt-3 !text-[1.7rem]">{service.title}</h3>
                  <p className="t-body mt-3 max-w-sm">{service.summary}</p>
                </div>
                <ServiceGlyph slug={service.slug} className="size-14 shrink-0 text-ash" />
              </div>
            </Link>
          </li>
        ))}
      </ul>
    </>
  );
}
