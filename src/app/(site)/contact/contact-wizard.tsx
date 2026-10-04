"use client";

import Link from "next/link";
import { useActionState, useEffect, useRef, useState, type FormEvent } from "react";
import { submitLeadAction, type LeadState } from "./actions";
import { BUDGETS, SERVICE_OPTIONS, TIMELINES } from "./options";

const initial: LeadState = {};
const GLYPHS = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789/+=<>#%";
const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const STEPS = 8;

/** Big text that decodes from random characters into the real message, left to right. */
function DecodeText({ text, delay = 0, duration = 1500, className = "" }: { text: string; delay?: number; duration?: number; className?: string }) {
  const [shown, setShown] = useState(() => text.replace(/[^\s.]/g, " "));

  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      const id = requestAnimationFrame(() => setShown(text));
      return () => cancelAnimationFrame(id);
    }
    let frame = 0;
    const timer = window.setTimeout(() => {
      const started = performance.now();
      const step = (now: number) => {
        const progress = Math.min(1, (now - started) / duration);
        const settled = Math.floor(progress * text.length);
        setShown(
          text
            .split("")
            .map((char, index) => (char === " " || char === "." || index < settled ? char : GLYPHS[Math.floor(Math.random() * GLYPHS.length)]))
            .join(""),
        );
        if (progress < 1) frame = requestAnimationFrame(step);
        else setShown(text);
      };
      frame = requestAnimationFrame(step);
    }, delay);
    return () => {
      window.clearTimeout(timer);
      cancelAnimationFrame(frame);
    };
  }, [text, delay, duration]);

  return (
    <span className={className} aria-label={text}>
      <span aria-hidden>{shown}</span>
    </span>
  );
}

/**
 * Phone version of the inquiry form: one question per screen, no scrolling. It is a fixed full-screen layer
 * (hidden from `md` up, where the long form is used). Every field stays mounted inside ONE real <form>, so the
 * server action receives exactly the same fields as the desktop form; steps just show and hide them.
 */
export function ContactWizard() {
  const [state, action, pending] = useActionState(submitLeadAction, initial);
  const [startedAt] = useState(() => Date.now());
  const [step, setStep] = useState(0);
  const [direction, setDirection] = useState<1 | -1>(1);
  const [values, setValues] = useState({ name: "", email: "", business: "", phone: "", website: "", details: "", budget: "", timeline: "" });
  const [services, setServices] = useState<string[]>([]);
  const [noWebsite, setNoWebsite] = useState(false);
  const [noSocial, setNoSocial] = useState(false);
  const [error, setError] = useState("");
  const formRef = useRef<HTMLFormElement>(null);
  const hasInteracted = useRef(false);

  // The wizard owns the screen on phones: stop the page behind it from scrolling.
  useEffect(() => {
    if (!window.matchMedia("(max-width: 767px)").matches) return;
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = previous;
    };
  }, []);

  // Focus the first field of each step (but not on first paint, to avoid popping the keyboard on arrival).
  useEffect(() => {
    if (!hasInteracted.current) return;
    const frame = requestAnimationFrame(() => {
      const field = formRef.current?.querySelector<HTMLElement>(`[data-step="${step}"] input:not([type=checkbox]):not([type=hidden]), [data-step="${step}"] textarea, [data-step="${step}"] select`);
      field?.focus({ preventScroll: true });
    });
    return () => cancelAnimationFrame(frame);
  }, [step]);

  const set = (key: keyof typeof values) => (event: { target: { value: string } }) => setValues((current) => ({ ...current, [key]: event.target.value }));

  const problem = (index: number): string => {
    if (index === 0 && !values.name.trim()) return "Please tell me your name.";
    if (index === 1 && !EMAIL.test(values.email.trim())) return "Please enter a valid email address.";
    if (index === 3 && services.length === 0) return "Pick at least one. “Not sure yet” is fine.";
    return "";
  };

  const next = () => {
    const message = problem(step);
    if (message) {
      setError(message);
      return;
    }
    setError("");
    hasInteracted.current = true;
    setDirection(1);
    if (step < STEPS - 1) setStep(step + 1);
    else formRef.current?.requestSubmit();
  };
  const back = () => {
    setError("");
    hasInteracted.current = true;
    setDirection(-1);
    setStep((current) => Math.max(0, current - 1));
  };
  const onSubmit = (event: FormEvent<HTMLFormElement>) => {
    if (step < STEPS - 1) {
      event.preventDefault();
      next();
    }
  };

  if (state.success) {
    return (
      <div data-contact-wizard className="fixed inset-0 z-[70] flex flex-col justify-between overflow-hidden bg-ink px-6 pb-8 pt-10 md:hidden" role="status">
        <p className="t-label">Message received</p>
        <div className="space-y-4">
          <p className="t-display !text-[clamp(3rem,15vw,5.5rem)] !leading-[0.95] text-white">
            <DecodeText text="Signal sent." duration={1300} />
          </p>
          <p className="t-display !text-[clamp(3rem,15vw,5.5rem)] !leading-[0.95] text-white">
            <DecodeText text="We begin at zero." delay={1500} duration={1800} />
          </p>
          <p className="wizard-fade t-body max-w-xs pt-4" style={{ animationDelay: "3.6s" }}>
            {state.success}
          </p>
        </div>
        <Link href="/" className="wizard-fade btn btn-solid w-full justify-between" style={{ animationDelay: "4s" }}>
          Back to home <span className="arrow" aria-hidden>→</span>
        </Link>
      </div>
    );
  }

  const progress = ((step + 1) / STEPS) * 100;
  const toggleService = (value: string) =>
    setServices((current) => (current.includes(value) ? current.filter((item) => item !== value) : [...current, value]));
  const stepClass = (index: number) => (index === step ? `wizard-step ${direction === 1 ? "wizard-from-right" : "wizard-from-left"}` : "hidden");

  return (
    <form
      ref={formRef}
      action={action}
      onSubmit={onSubmit}
      noValidate
      data-contact-wizard
      className="fixed inset-0 z-[70] flex h-dvh flex-col overflow-hidden bg-ink md:hidden"
    >
      {/* honeypot + fill-time check */}
      <div aria-hidden className="absolute -left-[9999px] h-0 w-0 overflow-hidden">
        <label>
          Leave this empty
          <input type="text" name="company_url" tabIndex={-1} autoComplete="off" />
        </label>
      </div>
      <input type="hidden" name="started_at" value={startedAt} />
      {services.map((service) => (
        <input key={service} type="hidden" name="services" value={service} />
      ))}

      <header className="flex items-center justify-between px-5 pb-3 pt-5">
        <button type="button" onClick={back} disabled={step === 0} aria-label="Previous question" className={`t-label !text-bone transition-opacity ${step === 0 ? "pointer-events-none opacity-0" : ""}`}>
          ← Back
        </button>
        <p className="t-label" aria-live="polite">
          {step + 1} / {STEPS}
        </p>
        <Link href="/" className="t-label !text-bone" aria-label="Close and go to the home page">
          Close ✕
        </Link>
      </header>
      <div className="mx-5 h-px bg-rule" aria-hidden>
        <div className="h-px bg-bone transition-[width] duration-500 ease-[var(--ease-out)]" style={{ width: `${progress}%` }} />
      </div>

      <div className="relative flex-1 overflow-hidden px-5 pt-8">
        {/* 0 name */}
        <div data-step="0" className={stepClass(0)}>
          <label htmlFor="w-name" className="t-title !text-[1.9rem] !leading-[1.1]">What&apos;s your name?</label>
          <input id="w-name" name="name" value={values.name} onChange={set("name")} maxLength={160} autoComplete="name" enterKeyHint="next" className="field mt-8" placeholder="Jane Smith" />
        </div>

        {/* 1 email */}
        <div data-step="1" className={stepClass(1)}>
          <label htmlFor="w-email" className="t-title !text-[1.9rem] !leading-[1.1]">Where can I reach you?</label>
          <input id="w-email" name="email" type="email" inputMode="email" value={values.email} onChange={set("email")} maxLength={254} autoComplete="email" autoCapitalize="none" enterKeyHint="next" className="field mt-8" placeholder="you@company.com" />
        </div>

        {/* 2 business + phone */}
        <div data-step="2" className={stepClass(2)}>
          <p className="t-title !text-[1.9rem] !leading-[1.1]">Tell me about your business.</p>
          <p className="t-body mt-3 !text-[0.92rem]">Both are optional.</p>
          <label htmlFor="w-business" className="sr-only">Business name</label>
          <input id="w-business" name="business" value={values.business} onChange={set("business")} maxLength={200} autoComplete="organization" enterKeyHint="next" className="field mt-6" placeholder="Business name" />
          <label htmlFor="w-phone" className="sr-only">Phone</label>
          <input id="w-phone" name="phone" type="tel" inputMode="tel" value={values.phone} onChange={set("phone")} maxLength={40} autoComplete="tel" enterKeyHint="next" className="field mt-4" placeholder="Phone number" />
        </div>

        {/* 3 services */}
        <div data-step="3" className={stepClass(3)}>
          <p className="t-title !text-[1.9rem] !leading-[1.1]">What do you need?</p>
          <p className="t-body mt-3 !text-[0.92rem]">Pick everything that applies.</p>
          <div className="mt-6 flex flex-wrap gap-2.5">
            {SERVICE_OPTIONS.map((option) => (
              <button
                key={option.value}
                type="button"
                aria-pressed={services.includes(option.value)}
                onClick={() => toggleService(option.value)}
                className={`chip ${services.includes(option.value) ? "!bg-bone !text-ink !border-bone" : ""}`}
              >
                {option.label}
              </button>
            ))}
          </div>
        </div>

        {/* 4 budget + start (dropdowns) */}
        <div data-step="4" className={stepClass(4)}>
          <p className="t-title !text-[1.9rem] !leading-[1.1]">Budget and timing.</p>
          <p className="t-body mt-3 !text-[0.92rem]">A rough idea is plenty.</p>
          <label htmlFor="w-budget" className="t-label mt-8 block">Budget range</label>
          <select id="w-budget" name="budget" value={values.budget} onChange={set("budget")} className="field">
            <option value="">Choose one…</option>
            {BUDGETS.map((budget) => (
              <option key={budget} value={budget}>{budget}</option>
            ))}
          </select>
          <label htmlFor="w-timeline" className="t-label mt-8 block">When would you like to start?</label>
          <select id="w-timeline" name="timeline" value={values.timeline} onChange={set("timeline")} className="field">
            <option value="">Choose one…</option>
            {TIMELINES.map((timeline) => (
              <option key={timeline} value={timeline}>{timeline}</option>
            ))}
          </select>
        </div>

        {/* 5 website */}
        <div data-step="5" className={stepClass(5)}>
          <label htmlFor="w-website" className="t-title !text-[1.9rem] !leading-[1.1]">Do you have a website?</label>
          <p className="t-body mt-3 !text-[0.92rem]">Paste the address so I can take a look.</p>
          <input id="w-website" name="website" type="url" inputMode="url" value={values.website} onChange={set("website")} autoCapitalize="none" autoCorrect="off" maxLength={300} disabled={noWebsite} enterKeyHint="next" className="field mt-6 disabled:opacity-40" placeholder="https://yourbusiness.com" />
          <label className="mt-5 flex w-fit cursor-pointer items-center gap-3 py-1 text-sm text-mist">
            <input type="checkbox" name="no_website" checked={noWebsite} onChange={(event) => setNoWebsite(event.target.checked)} className="size-5 accent-white" />
            I don&apos;t have a website yet
          </label>
        </div>

        {/* 6 socials */}
        <div data-step="6" className={stepClass(6)}>
          <p className="t-title !text-[1.9rem] !leading-[1.1]">Where are you on social?</p>
          <p className="t-body mt-3 !text-[0.92rem]">Paste a link or @handle.</p>
          <div className={`mt-4 transition-opacity ${noSocial ? "opacity-40" : ""}`}>
            {[
              ["social_instagram", "Instagram"],
              ["social_facebook", "Facebook"],
              ["social_tiktok", "TikTok"],
              ["social_other", "Another link"],
            ].map(([name, label]) => (
              <div key={name}>
                <label htmlFor={`w-${name}`} className="sr-only">{label}</label>
                <input id={`w-${name}`} name={name} inputMode="url" autoCapitalize="none" autoCorrect="off" maxLength={200} disabled={noSocial} className="field !py-3" placeholder={label} />
              </div>
            ))}
          </div>
          <label className="mt-4 flex w-fit cursor-pointer items-center gap-3 py-1 text-sm text-mist">
            <input type="checkbox" name="no_social" checked={noSocial} onChange={(event) => setNoSocial(event.target.checked)} className="size-5 accent-white" />
            I don&apos;t have any social accounts
          </label>
        </div>

        {/* 7 details */}
        <div data-step="7" className={stepClass(7)}>
          <label htmlFor="w-details" className="t-title !text-[1.9rem] !leading-[1.1]">Anything else?</label>
          <p className="t-body mt-3 !text-[0.92rem]">What are you trying to achieve? Optional.</p>
          <textarea id="w-details" name="details" value={values.details} onChange={set("details")} rows={5} maxLength={3000} className="field mt-6 resize-none" placeholder="Timing, examples you like, who it's for…" />
        </div>
      </div>

      <footer className="px-5 pb-[max(1.25rem,env(safe-area-inset-bottom))] pt-3">
        {error || state.error ? (
          <p role="alert" className="mb-3 text-sm text-bone">{error || state.error}</p>
        ) : null}
        <button type="button" onClick={next} disabled={pending} className="btn btn-solid w-full justify-between disabled:opacity-60">
          {step === STEPS - 1 ? (pending ? "Sending…" : "Send inquiry") : "Next"} <span className="arrow" aria-hidden>→</span>
        </button>
      </footer>
    </form>
  );
}
