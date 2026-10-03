"use client";

import { useEffect, useRef, useState, type ElementType } from "react";

/**
 * Typewriter text. Types the string out once, the first time it scrolls into view.
 *
 * Accessibility and SEO: the full text is always in the DOM for screen readers and crawlers
 * (`sr-only`); the animated copy is `aria-hidden`. Space for the full text is reserved with a CSS
 * pseudo-element, so typing never shifts the layout. Under reduced motion, or without JS, the full text
 * is shown immediately.
 */
export function TypedText({
  text,
  speed = 28,
  delay = 0,
  caret = true,
  className = "",
  as: Tag = "span",
}: {
  text: string;
  /** Milliseconds per character. */
  speed?: number;
  /** Milliseconds to wait after the element becomes visible. */
  delay?: number;
  caret?: boolean;
  className?: string;
  as?: ElementType;
}) {
  const ref = useRef<HTMLElement>(null);
  const [count, setCount] = useState(0);
  const [caretOn, setCaretOn] = useState(true);

  useEffect(() => {
    const node = ref.current;
    if (!node) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches || typeof IntersectionObserver === "undefined") {
      const id = requestAnimationFrame(() => {
        setCount(text.length);
        setCaretOn(false);
      });
      return () => cancelAnimationFrame(id);
    }
    let interval = 0;
    let startTimer = 0;
    let hideTimer = 0;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (!entry.isIntersecting) return;
        observer.disconnect();
        startTimer = window.setTimeout(() => {
          let shown = 0;
          interval = window.setInterval(() => {
            shown += 1;
            setCount(shown);
            if (shown >= text.length) {
              window.clearInterval(interval);
              hideTimer = window.setTimeout(() => setCaretOn(false), 1600);
            }
          }, speed);
        }, delay);
      },
      { threshold: 0.2 },
    );
    observer.observe(node);
    return () => {
      observer.disconnect();
      window.clearTimeout(startTimer);
      window.clearTimeout(hideTimer);
      window.clearInterval(interval);
    };
  }, [text, speed, delay]);

  return (
    <Tag ref={ref} className={`typed relative ${className}`}>
      <span className="sr-only">{text}</span>
      <span aria-hidden className="typed-full" data-text={text} />
      {/* The typed characters live in an attribute and are painted by CSS, so the DOM text is the heading once. */}
      <span aria-hidden className="typed-live" data-typed={text.slice(0, count)}>
        {caret && caretOn ? <span className="typed-caret caret" /> : null}
      </span>
    </Tag>
  );
}

/**
 * Types a phrase, holds it, deletes it, then moves to the next one, forever.
 * The first phrase is the accessible / no-JS text; reduced motion shows it statically.
 */
export function TypeRotator({
  phrases,
  className = "",
  typeSpeed = 55,
  deleteSpeed = 30,
  hold = 1800,
}: {
  phrases: string[];
  className?: string;
  typeSpeed?: number;
  deleteSpeed?: number;
  hold?: number;
}) {
  const [shown, setShown] = useState("");
  const [animate, setAnimate] = useState(false);

  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const id = requestAnimationFrame(() => setAnimate(true));
    return () => cancelAnimationFrame(id);
  }, []);

  useEffect(() => {
    if (!animate) return;
    let phrase = 0;
    let length = 0;
    let deleting = false;
    let timer = 0;
    const tick = () => {
      const current = phrases[phrase];
      if (!deleting) {
        length += 1;
        setShown(current.slice(0, length));
        if (length >= current.length) {
          deleting = true;
          timer = window.setTimeout(tick, hold);
          return;
        }
        timer = window.setTimeout(tick, typeSpeed);
      } else {
        length -= 1;
        setShown(current.slice(0, length));
        if (length <= 0) {
          deleting = false;
          phrase = (phrase + 1) % phrases.length;
          timer = window.setTimeout(tick, 350);
          return;
        }
        timer = window.setTimeout(tick, deleteSpeed);
      }
    };
    timer = window.setTimeout(tick, 600);
    return () => window.clearTimeout(timer);
  }, [animate, phrases, typeSpeed, deleteSpeed, hold]);

  return (
    <span className={className}>
      <span className="sr-only">{phrases.join(", ")}</span>
      <span aria-hidden className="typed-live-inline" data-typed={animate ? shown : phrases[0]} />
      {animate ? <span aria-hidden className="typed-caret caret" /> : null}
    </span>
  );
}
