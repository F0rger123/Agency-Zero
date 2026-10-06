"use client";

import { useRef, useState, type ReactNode } from "react";

export type WizardStep = { title: string; hint?: string; content: ReactNode };

/**
 * Step-by-step layout for one form. Every step stays mounted (hidden when inactive) so a single
 * submit carries all the fields; "Next" validates the visible step before moving on.
 * The finish control (submit button + message) is passed in and only shown on the last step.
 */
export function Wizard({ steps, finish }: { steps: WizardStep[]; finish: ReactNode }) {
  const [index, setIndex] = useState(0);
  const panelRefs = useRef<(HTMLDivElement | null)[]>([]);
  const last = index === steps.length - 1;

  const next = () => {
    const panel = panelRefs.current[index];
    const fields = panel ? Array.from(panel.querySelectorAll<HTMLInputElement>("input, select, textarea")) : [];
    for (const field of fields) {
      if (!field.reportValidity()) return;
    }
    setIndex((value) => Math.min(value + 1, steps.length - 1));
  };

  return (
    <div
      data-wizard
      onKeyDown={(event) => {
        // Enter inside a field moves to the next step instead of submitting early.
        if (event.key === "Enter" && !last && event.target instanceof HTMLInputElement) {
          event.preventDefault();
          next();
        }
      }}
    >
      <ol className="mb-6 flex items-center gap-2" aria-label="Steps">
        {steps.map((step, position) => (
          <li key={step.title} className="flex flex-1 items-center gap-2" aria-current={position === index ? "step" : undefined}>
            <span
              className={`flex size-6 shrink-0 items-center justify-center rounded-full border text-[11px] font-semibold transition-colors ${
                position <= index ? "border-foreground bg-foreground text-background" : "border-border text-muted-foreground"
              }`}
            >
              {position + 1}
            </span>
            <span className={`hidden text-xs sm:block ${position === index ? "font-medium" : "text-muted-foreground"}`}>{step.title}</span>
            {position < steps.length - 1 ? (
              <span className={`h-px flex-1 transition-colors ${position < index ? "bg-foreground" : "bg-border"}`} />
            ) : null}
          </li>
        ))}
      </ol>

      {steps.map((step, position) => (
        <div key={step.title} ref={(node) => { panelRefs.current[position] = node; }} hidden={position !== index} className="widget-in">
          <h3 className="text-base font-semibold tracking-tight">{step.title}</h3>
          {step.hint ? <p className="mb-4 mt-1 text-sm text-muted-foreground">{step.hint}</p> : <div className="mb-4" />}
          {step.content}
        </div>
      ))}

      <div className="mt-8 flex flex-wrap items-center gap-3 border-t border-border pt-5">
        {index > 0 ? (
          <button
            type="button"
            onClick={() => setIndex((value) => Math.max(value - 1, 0))}
            className="press rounded-md border border-border px-4 py-2 text-sm transition-colors hover:bg-muted"
          >
            Back
          </button>
        ) : null}
        {last ? (
          finish
        ) : (
          <button
            type="button"
            onClick={next}
            className="press rounded-md bg-inverted px-4 py-2 text-sm font-medium text-inverted-foreground transition-opacity hover:opacity-80"
          >
            Next
          </button>
        )}
      </div>
    </div>
  );
}
