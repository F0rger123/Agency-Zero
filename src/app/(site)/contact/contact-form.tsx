"use client";

import { useActionState, useState, type ReactNode } from "react";
import { submitLeadAction, type LeadState } from "./actions";
import { ContactWizard } from "./contact-wizard";
import { BUDGETS, SERVICE_OPTIONS, SOCIAL_FIELDS, TIMELINES } from "./options";

const initial: LeadState = {};

/** A numbered form section. Single column on phones, two columns from `sm`. */
function Step({ number, title, hint, children }: { number: string; title: string; hint?: string; children: ReactNode }) {
  return (
    <fieldset className="border-t border-rule pt-8 md:pt-10">
      <legend className="sr-only">{title}</legend>
      <div className="flex items-baseline gap-4" aria-hidden>
        <span className="t-label">{number}</span>
        <p className="t-title !text-[1.35rem] md:!text-[1.6rem]">{title}</p>
      </div>
      {hint ? <p className="t-body mt-3 max-w-md !text-[0.92rem]">{hint}</p> : null}
      <div className="mt-8">{children}</div>
    </fieldset>
  );
}

function LongForm() {
  const [state, action, pending] = useActionState(submitLeadAction, initial);
  const [startedAt] = useState(() => Date.now());
  const [noWebsite, setNoWebsite] = useState(false);
  const [noSocial, setNoSocial] = useState(false);

  if (state.success) {
    return (
      <div role="status" className="border border-rule-strong p-8 md:p-12">
        <p className="t-label">Message received</p>
        <p className="t-title mt-6">{state.success}</p>
        <p className="t-body mt-4 max-w-md">
          I read every message personally. If it&apos;s urgent, email me directly and mention what you need.
        </p>
      </div>
    );
  }

  return (
    <form action={action} className="space-y-10 md:space-y-12">
      {/* honeypot (hidden from people and assistive tech) + fill-time check */}
      <div aria-hidden className="absolute -left-[9999px] h-0 w-0 overflow-hidden">
        <label>
          Leave this empty
          <input type="text" name="company_url" tabIndex={-1} autoComplete="off" />
        </label>
      </div>
      <input type="hidden" name="started_at" value={startedAt} />

      <Step number="01" title="About you">
        <div className="grid gap-x-10 gap-y-8 sm:grid-cols-2">
          <div>
            <label htmlFor="name" className="t-label">Your name *</label>
            <input id="name" name="name" required maxLength={160} autoComplete="name" enterKeyHint="next" className="field" placeholder="Jane Smith" />
          </div>
          <div>
            <label htmlFor="business" className="t-label">Business</label>
            <input id="business" name="business" maxLength={200} autoComplete="organization" enterKeyHint="next" className="field" placeholder="Company name" />
          </div>
          <div>
            <label htmlFor="email" className="t-label">Email *</label>
            <input id="email" name="email" type="email" inputMode="email" required maxLength={254} autoComplete="email" autoCapitalize="none" enterKeyHint="next" className="field" placeholder="you@company.com" />
          </div>
          <div>
            <label htmlFor="phone" className="t-label">Phone (optional)</label>
            <input id="phone" name="phone" type="tel" inputMode="tel" maxLength={40} autoComplete="tel" enterKeyHint="next" className="field" placeholder="+1 …" />
          </div>
        </div>
      </Step>

      <Step number="02" title="What you need" hint="Pick everything that applies. Not sure? Choose “Not sure yet” and tell me about it below.">
        <div className="flex flex-wrap gap-3">
          {SERVICE_OPTIONS.map((option) => (
            <label key={option.value} className="contents">
              <input type="checkbox" name="services" value={option.value} className="peer sr-only" />
              <span className="chip">{option.label}</span>
            </label>
          ))}
        </div>

        <p className="t-label mt-10">Budget range</p>
        <div className="mt-4 flex flex-wrap gap-3">
          {BUDGETS.map((budget) => (
            <label key={budget} className="contents">
              <input type="radio" name="budget" value={budget} className="peer sr-only" />
              <span className="chip">{budget}</span>
            </label>
          ))}
        </div>

        <p className="t-label mt-10">When would you like to start?</p>
        <div className="mt-4 flex flex-wrap gap-3">
          {TIMELINES.map((timeline) => (
            <label key={timeline} className="contents">
              <input type="radio" name="timeline" value={timeline} className="peer sr-only" />
              <span className="chip">{timeline}</span>
            </label>
          ))}
        </div>
      </Step>

      <Step number="03" title="Where you are online" hint="Paste what you have so I can look before we talk. If you have none, tick the box.">
        <div>
          <label htmlFor="website" className="t-label">Website</label>
          <input
            id="website"
            name="website"
            type="url"
            inputMode="url"
            autoCapitalize="none"
            autoCorrect="off"
            maxLength={300}
            disabled={noWebsite}
            enterKeyHint="next"
            className="field disabled:opacity-40"
            placeholder="https://yourbusiness.com"
          />
          <label className="mt-4 flex w-fit cursor-pointer items-center gap-3 py-1 text-sm text-mist">
            <input
              type="checkbox"
              name="no_website"
              checked={noWebsite}
              onChange={(event) => setNoWebsite(event.target.checked)}
              className="size-5 accent-white"
            />
            I don&apos;t have a website yet
          </label>
        </div>

        <div className="mt-10">
          <p className="t-label">Social profiles</p>
          <div className={`mt-2 grid gap-x-10 gap-y-6 transition-opacity duration-300 sm:grid-cols-2 ${noSocial ? "opacity-40" : ""}`}>
            {SOCIAL_FIELDS.map((social) => (
              <div key={social.name}>
                <label htmlFor={social.name} className="sr-only">{social.label}</label>
                <input
                  id={social.name}
                  name={social.name}
                  inputMode="url"
                  autoCapitalize="none"
                  autoCorrect="off"
                  maxLength={200}
                  disabled={noSocial}
                  className="field"
                  placeholder={`${social.label}: ${social.placeholder}`}
                />
              </div>
            ))}
          </div>
          <label className="mt-4 flex w-fit cursor-pointer items-center gap-3 py-1 text-sm text-mist">
            <input
              type="checkbox"
              name="no_social"
              checked={noSocial}
              onChange={(event) => setNoSocial(event.target.checked)}
              className="size-5 accent-white"
            />
            I don&apos;t have any social accounts
          </label>
        </div>
      </Step>

      <Step number="04" title="Anything else?">
        <label htmlFor="details" className="sr-only">Tell me about your business</label>
        <textarea
          id="details"
          name="details"
          rows={5}
          maxLength={3000}
          className="field resize-y"
          placeholder="What are you trying to achieve? Anything I should know, like timing, examples you like, or who it's for."
        />
      </Step>

      <div className="flex flex-col gap-5 sm:flex-row sm:flex-wrap sm:items-center sm:gap-6">
        <button type="submit" disabled={pending} className="btn btn-solid w-full justify-between disabled:opacity-60 sm:w-auto">
          {pending ? "Sending…" : "Send inquiry"} <span className="arrow" aria-hidden>→</span>
        </button>
        {state.error ? (
          <p role="alert" className="text-sm text-bone">
            {state.error}
          </p>
        ) : (
          <p className="t-label">I reply within one business day.</p>
        )}
      </div>
    </form>
  );
}

/**
 * Project inquiry. Phones get a one-question-per-screen wizard (no scrolling); tablets and desktops get the full form.
 * Both submit the same fields to the same server action, and each works without JS.
 */
export function ContactForm() {
  return (
    <>
      <div className="hidden md:block">
        <LongForm />
      </div>
      <ContactWizard />
    </>
  );
}
