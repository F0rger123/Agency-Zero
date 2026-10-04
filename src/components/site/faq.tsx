"use client";

import { useId, useState } from "react";

export type FaqItem = { q: string; a: string; bullets?: string[] };

/**
 * Accessible accordion for questions and answers. One item opens at a time; the panel height animates
 * (grid-rows 0fr → 1fr), the plus turns into a cross, and the answer can carry a short bullet list.
 * All answers stay in the DOM (and in the page's FAQ structured data) while collapsed.
 */
export function Faq({ items }: { items: FaqItem[] }) {
  const [open, setOpen] = useState<number | null>(0);
  const base = useId();
  return (
    <div className="divide-y divide-rule border-y border-rule">
      {items.map((item, index) => {
        const isOpen = open === index;
        const panelId = `${base}-panel-${index}`;
        const buttonId = `${base}-button-${index}`;
        return (
          <div key={item.q} className="group">
            <h3>
              <button
                id={buttonId}
                type="button"
                aria-expanded={isOpen}
                aria-controls={panelId}
                onClick={() => setOpen(isOpen ? null : index)}
                className="flex w-full items-center justify-between gap-6 py-6 text-left text-lg tracking-tight transition-colors hover:text-bone md:text-xl"
              >
                <span className="flex gap-4">
                  <span className="t-label pt-1.5">0{index + 1}</span>
                  {item.q}
                </span>
                <span
                  aria-hidden
                  className={`relative block size-5 shrink-0 transition-transform duration-500 ease-[var(--ease-out)] ${isOpen ? "rotate-45" : ""}`}
                >
                  <span className="absolute left-0 top-1/2 h-px w-full bg-bone" />
                  <span className="absolute left-1/2 top-0 h-full w-px bg-bone" />
                </span>
              </button>
            </h3>
            <div
              id={panelId}
              role="region"
              aria-labelledby={buttonId}
              className={`grid transition-[grid-template-rows,opacity] duration-500 ease-[var(--ease-out)] ${
                isOpen ? "grid-rows-[1fr] opacity-100" : "grid-rows-[0fr] opacity-0"
              }`}
            >
              <div className="overflow-hidden">
                <div className="pb-8 pl-0 md:pl-10">
                  <p className="t-body max-w-2xl">{item.a}</p>
                  {item.bullets?.length ? (
                    <ul className="mt-5 max-w-2xl space-y-2 text-sm text-mist">
                      {item.bullets.map((bullet) => (
                        <li key={bullet} className="flex gap-3">
                          <span className="text-ash" aria-hidden>—</span>
                          {bullet}
                        </li>
                      ))}
                    </ul>
                  ) : null}
                </div>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
