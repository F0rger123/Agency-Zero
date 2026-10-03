"use client";

import { useActionState, useState } from "react";
import { submitLeadAction, type LeadState } from "./actions";
import { BUDGETS, SERVICE_OPTIONS } from "./options";

const initial: LeadState = {};

/** Premium project-inquiry form. Works without JS (progressive enhancement via the server action). */
export function ContactForm() {
  const [state, action, pending] = useActionState(submitLeadAction, initial);
  const [startedAt] = useState(() => Date.now());

  if (state.success) {
    return (
      <div role="status" className="border border-rule-strong p-8 md:p-12">
        <p className="t-label">Message received</p>
        <p className="t-title mt-6">{state.success}</p>
        <p className="t-body mt-4 max-w-md">
          I read every message personally. If it&apos;s urgent, email me directly and mention your project.
        </p>
      </div>
    );
  }

  return (
    <form action={action} className="space-y-12" noValidate={false}>
      {/* honeypot (hidden from people and assistive tech) + fill-time check */}
      <div aria-hidden className="absolute -left-[9999px] h-0 w-0 overflow-hidden">
        <label>
          Leave this empty
          <input type="text" name="company_url" tabIndex={-1} autoComplete="off" />
        </label>
      </div>
      <input type="hidden" name="started_at" value={startedAt} />

      <div className="grid gap-x-10 gap-y-10 md:grid-cols-2">
        <div>
          <label htmlFor="name" className="t-label">Your name *</label>
          <input id="name" name="name" required maxLength={160} autoComplete="name" className="field" placeholder="Jane Smith" />
        </div>
        <div>
          <label htmlFor="business" className="t-label">Business</label>
          <input id="business" name="business" maxLength={200} autoComplete="organization" className="field" placeholder="Company name" />
        </div>
        <div>
          <label htmlFor="email" className="t-label">Email *</label>
          <input id="email" name="email" type="email" required maxLength={254} autoComplete="email" className="field" placeholder="you@company.com" />
        </div>
        <div>
          <label htmlFor="phone" className="t-label">Phone (optional)</label>
          <input id="phone" name="phone" type="tel" maxLength={40} autoComplete="tel" className="field" placeholder="+1 …" />
        </div>
      </div>

      <fieldset>
        <legend className="t-label">What do you need?</legend>
        <div className="mt-5 flex flex-wrap gap-3">
          {SERVICE_OPTIONS.map((option) => (
            <label key={option.value} className="contents">
              <input type="checkbox" name="services" value={option.value} className="peer sr-only" />
              <span className="chip">{option.label}</span>
            </label>
          ))}
        </div>
      </fieldset>

      <div className="max-w-sm">
        <label htmlFor="budget" className="t-label">Budget range</label>
        <select id="budget" name="budget" defaultValue="" className="field">
          <option value="">Select…</option>
          {BUDGETS.map((budget) => (
            <option key={budget} value={budget}>
              {budget}
            </option>
          ))}
        </select>
      </div>

      <div>
        <label htmlFor="details" className="t-label">Project details</label>
        <textarea
          id="details"
          name="details"
          rows={5}
          maxLength={4000}
          className="field resize-y"
          placeholder="What are you trying to achieve? Anything I should know — timing, links, who it's for."
        />
      </div>

      <div className="flex flex-wrap items-center gap-6">
        <button type="submit" disabled={pending} className="btn btn-solid disabled:opacity-60">
          {pending ? "Sending…" : "Send inquiry"} <span className="arrow" aria-hidden>→</span>
        </button>
        {state.error ? (
          <p role="alert" className="text-sm text-bone">
            {state.error}
          </p>
        ) : (
          <p className="t-label">I reply within one working day.</p>
        )}
      </div>
    </form>
  );
}
