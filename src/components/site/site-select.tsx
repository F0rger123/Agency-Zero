"use client";

import { useEffect, useId, useRef, useState } from "react";

/**
 * Accessible custom select for the public forms (WAI-ARIA "select-only combobox" pattern).
 *
 * - A real button opens an in-flow list (no portal, so it works inside the full-screen mobile form and never clips).
 * - Keyboard: Enter / Space / ArrowDown open; Arrow keys, Home, End move; type a letter to jump; Enter selects;
 *   Escape closes and returns focus to the button; Tab closes.
 * - The chosen value is submitted through a hidden input, so it works with a normal <form action>.
 * - Options are at least 52px tall for thumbs; selection is shown with a check mark AND an inverted row (not colour alone).
 */
export function SiteSelect({
  name,
  label,
  options,
  value,
  onChange,
  placeholder = "Choose one",
  hint,
}: {
  name: string;
  label: string;
  options: readonly string[];
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  hint?: string;
}) {
  const uid = useId();
  const buttonId = `${uid}-button`;
  const listId = `${uid}-list`;
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(0);
  const button = useRef<HTMLButtonElement>(null);
  const list = useRef<HTMLUListElement>(null);
  const typed = useRef({ text: "", timer: 0 });

  const selectedIndex = options.indexOf(value);

  const close = (refocus: boolean) => {
    setOpen(false);
    if (refocus) button.current?.focus();
  };
  const openList = () => {
    setActive(selectedIndex >= 0 ? selectedIndex : 0);
    setOpen(true);
  };
  const choose = (index: number) => {
    onChange(options[index]);
    close(true);
  };

  // Keep the active option in view and focus the list so arrow keys work.
  useEffect(() => {
    if (!open) return;
    list.current?.focus({ preventScroll: true });
  }, [open]);
  useEffect(() => {
    if (!open) return;
    list.current?.children[active]?.scrollIntoView({ block: "nearest" });
  }, [active, open]);

  // Close when focus or a click lands outside.
  useEffect(() => {
    if (!open) return;
    const onPointer = (event: PointerEvent) => {
      const target = event.target as Node;
      if (!button.current?.contains(target) && !list.current?.contains(target)) setOpen(false);
    };
    document.addEventListener("pointerdown", onPointer);
    return () => document.removeEventListener("pointerdown", onPointer);
  }, [open]);

  const onButtonKey = (event: React.KeyboardEvent) => {
    if (["ArrowDown", "ArrowUp", "Enter", " "].includes(event.key)) {
      event.preventDefault();
      openList();
    }
  };

  const onListKey = (event: React.KeyboardEvent) => {
    const last = options.length - 1;
    switch (event.key) {
      case "ArrowDown":
        event.preventDefault();
        setActive((index) => Math.min(last, index + 1));
        break;
      case "ArrowUp":
        event.preventDefault();
        setActive((index) => Math.max(0, index - 1));
        break;
      case "Home":
        event.preventDefault();
        setActive(0);
        break;
      case "End":
        event.preventDefault();
        setActive(last);
        break;
      case "Enter":
      case " ":
        event.preventDefault();
        choose(active);
        break;
      case "Escape":
        event.preventDefault();
        close(true);
        break;
      case "Tab":
        setOpen(false);
        break;
      default:
        if (event.key.length === 1 && !event.ctrlKey && !event.metaKey && !event.altKey) {
          window.clearTimeout(typed.current.timer);
          typed.current.text += event.key.toLowerCase();
          typed.current.timer = window.setTimeout(() => (typed.current.text = ""), 600);
          const match = options.findIndex((option) => option.toLowerCase().startsWith(typed.current.text));
          if (match >= 0) setActive(match);
        }
    }
  };

  return (
    <div className="site-select">
      <label id={`${uid}-label`} htmlFor={buttonId} className="t-label block">
        {label}
      </label>
      <input type="hidden" name={name} value={value} />
      <button
        ref={button}
        id={buttonId}
        type="button"
        role="combobox"
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-controls={listId}
        aria-labelledby={`${uid}-label ${buttonId}`}
        data-open={open}
        data-empty={!value}
        onClick={() => (open ? close(false) : openList())}
        onKeyDown={onButtonKey}
        className="site-select-button"
      >
        <span className="truncate">{value || placeholder}</span>
        <svg aria-hidden viewBox="0 0 12 8" className="site-select-chevron" fill="none" stroke="currentColor" strokeWidth="1.5">
          <path d="M1 1.5 6 6.5l5-5" />
        </svg>
      </button>
      {hint ? <p className="mt-2 text-xs text-ash">{hint}</p> : null}
      <ul
        ref={list}
        id={listId}
        role="listbox"
        tabIndex={-1}
        aria-labelledby={`${uid}-label`}
        aria-activedescendant={open ? `${uid}-opt-${active}` : undefined}
        hidden={!open}
        onKeyDown={onListKey}
        className="site-select-list"
      >
        {options.map((option, index) => (
          <li
            key={option}
            id={`${uid}-opt-${index}`}
            role="option"
            aria-selected={option === value}
            data-active={index === active}
            onPointerEnter={() => setActive(index)}
            onClick={() => choose(index)}
            className="site-select-option"
          >
            <span>{option}</span>
            {option === value ? (
              <svg aria-hidden viewBox="0 0 14 10" className="size-3.5" fill="none" stroke="currentColor" strokeWidth="1.8">
                <path d="M1 5.2 5 9 13 1" />
              </svg>
            ) : null}
          </li>
        ))}
      </ul>
    </div>
  );
}
