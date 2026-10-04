"use client";

import { useEffect, useRef, type ElementType } from "react";
import { TypedText } from "./typed-text";

export type TextEffectName = "words" | "mask" | "blur" | "typing";

/**
 * Word-by-word text entrance with three styles, all plain in-flow text (no overlays, no layout shift):
 *   words  each word fades and rises
 *   mask   each word slides up out of a clipped line
 *   blur   each word resolves from a soft blur
 * `typing` hands over to TypedText. Plays once, when scrolled into view; text is fully visible without JS
 * (see the <noscript> rule in the site layout) and under reduced motion.
 */
export function TextEffect({
  text,
  effect = "words",
  className = "",
  as: Tag = "span",
  delay = 0,
}: {
  text: string;
  effect?: TextEffectName;
  className?: string;
  as?: ElementType;
  delay?: number;
}) {
  const ref = useRef<HTMLElement>(null);

  useEffect(() => {
    const node = ref.current;
    if (!node || effect === "typing") return;
    if (typeof IntersectionObserver === "undefined") {
      node.classList.add("is-in");
      return;
    }
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          node.classList.add("is-in");
          observer.disconnect();
        }
      },
      { threshold: 0.2 },
    );
    observer.observe(node);
    return () => observer.disconnect();
  }, [effect]);

  if (effect === "typing") return <TypedText text={text} className={className} as={Tag} delay={delay} />;

  const words = text.split(" ");
  return (
    <Tag ref={ref} className={`fx fx-${effect} ${className}`} style={{ "--fx-delay": `${delay}ms` } as React.CSSProperties}>
      {words.map((word, index) => (
        <span key={`${word}-${index}`}>
          <span className="fx-word" style={{ "--i": index } as React.CSSProperties}>
            <span className="fx-inner">{word}</span>
          </span>
          {index < words.length - 1 ? " " : null}
        </span>
      ))}
    </Tag>
  );
}

const GLYPHS = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789/+=<>";

/** Small-caps labels decode from random characters into the real text (monospace labels only). */
export function ScrambleText({ text, className = "" }: { text: string; className?: string }) {
  const ref = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    const node = ref.current;
    if (!node) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches || typeof IntersectionObserver === "undefined") return;
    let frame = 0;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (!entry.isIntersecting) return;
        observer.disconnect();
        const started = performance.now();
        const duration = 650 + text.length * 14;
        const step = (now: number) => {
          const progress = Math.min(1, (now - started) / duration);
          const resolved = Math.floor(progress * text.length);
          node.textContent = text
            .split("")
            .map((char, index) =>
              index < resolved || char === " " ? char : GLYPHS[Math.floor(Math.random() * GLYPHS.length)],
            )
            .join("");
          if (progress < 1) frame = requestAnimationFrame(step);
          else node.textContent = text;
        };
        frame = requestAnimationFrame(step);
      },
      { threshold: 0.3 },
    );
    observer.observe(node);
    return () => {
      observer.disconnect();
      cancelAnimationFrame(frame);
    };
  }, [text]);

  return (
    <span ref={ref} className={className}>
      {text}
    </span>
  );
}
