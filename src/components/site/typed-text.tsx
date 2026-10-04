"use client";

import { useEffect, useRef, useState, type ElementType } from "react";

/** True when the visitor has switched typing animations off (see TypingToggle) or prefers reduced motion. */
function typingDisabled(): boolean {
  if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return true;
  return document.documentElement.dataset.typing === "off";
}

/**
 * Typewriter text, played once when it scrolls into view.
 *
 * The whole string is always in the DOM in normal flow: typed characters are visible and the rest is
 * transparent, so wrapping, height and surrounding layout never change while it types (nothing is
 * overlaid or absolutely positioned) and screen readers / crawlers read the full text once.
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
  // null = not started (SSR / before hydration): show the text so nothing is ever missing.
  const [count, setCount] = useState<number | null>(null);
  const [caretOn, setCaretOn] = useState(false);

  useEffect(() => {
    const node = ref.current;
    if (!node) return;
    if (typingDisabled() || typeof IntersectionObserver === "undefined") return;
    const holdFrame = requestAnimationFrame(() => setCount(0));
    let interval = 0;
    let startTimer = 0;
    let hideTimer = 0;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (!entry.isIntersecting) return;
        observer.disconnect();
        startTimer = window.setTimeout(() => {
          let shown = 0;
          setCaretOn(true);
          interval = window.setInterval(() => {
            shown += 1;
            setCount(shown);
            if (shown >= text.length) {
              window.clearInterval(interval);
              hideTimer = window.setTimeout(() => setCaretOn(false), 1400);
            }
          }, speed);
        }, delay);
      },
      { threshold: 0.2 },
    );
    observer.observe(node);
    return () => {
      cancelAnimationFrame(holdFrame);
      observer.disconnect();
      window.clearTimeout(startTimer);
      window.clearTimeout(hideTimer);
      window.clearInterval(interval);
    };
  }, [text, speed, delay]);

  const shown = count === null ? text.length : count;
  return (
    <Tag ref={ref} className={className}>
      <span>{text.slice(0, shown)}</span>
      {caret && caretOn ? <span aria-hidden className="typed-caret caret" /> : null}
      <span className="text-transparent">{text.slice(shown)}</span>
    </Tag>
  );
}

/**
 * Types a phrase, holds it, deletes it, then moves to the next one, forever.
 * The first phrase is the accessible / no-JS text; reduced motion or the typing toggle shows it statically.
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
    if (typingDisabled()) return;
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

/** Footer switch: lets visitors turn the typing animations off (remembered on this device). */
export function TypingToggle() {
  const [on, setOn] = useState(true);

  useEffect(() => {
    let stored: string | null = null;
    try {
      stored = window.localStorage.getItem("az-typing");
    } catch {
      /* storage can be blocked; default to on */
    }
    const enabled = stored !== "off";
    document.documentElement.dataset.typing = enabled ? "on" : "off";
    const id = requestAnimationFrame(() => setOn(enabled));
    return () => cancelAnimationFrame(id);
  }, []);

  const toggle = () => {
    const next = !on;
    setOn(next);
    document.documentElement.dataset.typing = next ? "on" : "off";
    try {
      window.localStorage.setItem("az-typing", next ? "on" : "off");
    } catch {
      /* ignore */
    }
  };

  return (
    <button type="button" onClick={toggle} aria-pressed={on} className="u-link t-label">
      Typing animation: {on ? "On" : "Off"}
    </button>
  );
}
