"use client";

import { useEffect, useRef } from "react";

const reduced = () => typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches;

/**
 * Counts a number up from zero when it appears, and again whenever it is clicked.
 * The server-rendered text is the final value, so nothing is blank without JavaScript.
 */
function useCountUp(target: number, format: (value: number) => string) {
  const ref = useRef<HTMLSpanElement>(null);
  const frame = useRef(0);
  const formatRef = useRef(format);
  useEffect(() => {
    formatRef.current = format;
  });

  const play = () => {
    const node = ref.current?.firstChild;
    if (!node || reduced()) return;
    cancelAnimationFrame(frame.current);
    const started = performance.now();
    const duration = 900;
    const tick = (now: number) => {
      const progress = Math.min((now - started) / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 4);
      node.nodeValue = formatRef.current(target * eased);
      if (progress < 1) frame.current = requestAnimationFrame(tick);
      else node.nodeValue = formatRef.current(target);
    };
    frame.current = requestAnimationFrame(tick);
  };

  useEffect(() => {
    play();
    return () => cancelAnimationFrame(frame.current);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [target]);

  return { ref, play };
}

/** A plain number (counts, percentages) that counts up on load and on click. */
export function CountUp({ value, suffix = "", className = "" }: { value: number; suffix?: string; className?: string }) {
  const format = (n: number) => `${Math.round(n).toLocaleString("en-US")}${suffix}`;
  const { ref, play } = useCountUp(value, format);
  return (
    <span ref={ref} key={value} onClick={play} className={`cursor-default tabular-nums ${className}`}>
      {format(value)}
    </span>
  );
}

/** Currency with a green symbol; the amount counts up on load and on click. */
export function Money({ cents, currency = "USD", className = "" }: { cents: number | null | undefined; currency?: string; className?: string }) {
  const value = (cents ?? 0) / 100;
  const formatter = (() => {
    try {
      return new Intl.NumberFormat("en-US", { style: "currency", currency });
    } catch {
      return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" });
    }
  })();
  const symbol = formatter.formatToParts(value).find((part) => part.type === "currency")?.value ?? "$";
  const withoutSymbol = (n: number) =>
    formatter
      .formatToParts(n)
      .filter((part) => part.type !== "currency")
      .map((part) => part.value)
      .join("")
      .trim();
  const { ref, play } = useCountUp(value, withoutSymbol);
  if (cents == null) return <span className={className}>—</span>;
  return (
    <span onClick={play} className={`cursor-default tabular-nums ${className}`}>
      <span className="font-semibold text-money">{symbol}</span>
      <span ref={ref} key={cents}>
        {withoutSymbol(value)}
      </span>
    </span>
  );
}
