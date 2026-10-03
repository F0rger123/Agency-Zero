"use client";

import { useFormStatus } from "react-dom";
import type { ChangeEventHandler, ReactNode } from "react";

/**
 * Primary action button: black with white text, everywhere.
 *
 * Callers that want a smaller, secondary button used to pass "bg-background text-muted-foreground …"
 * overrides. Tailwind does not resolve two `bg-*` utilities by class order, so those buttons came out
 * black with dark grey text, which is unreadable. Overrides are now reduced to sizing only: a caller
 * that passes `bg-background` gets a compact black button, and colour classes are dropped.
 */
const COLOUR_OVERRIDES = /^(bg-|text-(muted-foreground|foreground|faint-foreground)|hover:text-|ring-|font-normal)/;

export function SubmitButton({
  children,
  pendingLabel = "Saving…",
  className = "",
}: {
  children: ReactNode;
  pendingLabel?: string;
  className?: string;
}) {
  const { pending } = useFormStatus();
  const tokens = className.split(/\s+/).filter(Boolean);
  const compact = tokens.includes("bg-background");
  const extra = tokens.filter((token) => !COLOUR_OVERRIDES.test(token) && !(compact && /^p[xy]-0$/.test(token)));
  const sets = (pattern: RegExp) => extra.some((token) => pattern.test(token));
  const padding = sets(/^p[xy]-/) ? "" : compact ? "px-3 py-1.5" : "px-4 py-2";
  const size = sets(/^text-(xs|sm|base)$/) ? "" : compact ? "text-xs" : "text-sm";
  return (
    <button
      type="submit"
      disabled={pending}
      className={`inline-flex items-center justify-center rounded-md bg-inverted font-medium text-inverted-foreground transition-opacity hover:opacity-80 disabled:cursor-wait disabled:opacity-50 ${padding} ${size} ${extra.join(" ")}`}
    >
      {pending ? pendingLabel : children}
    </button>
  );
}

export function FormMessage({ error, success }: { error?: string; success?: string }) {
  if (!error && !success) return null;
  return (
    <p
      role={error ? "alert" : "status"}
      className={`text-sm leading-6 ${error ? "font-medium" : "text-muted-foreground"}`}
    >
      {error ?? success}
    </p>
  );
}

export function FieldLabel({
  label,
  htmlFor,
  required = false,
  hint,
}: {
  label: string;
  htmlFor: string;
  required?: boolean;
  hint?: string;
}) {
  return (
    <label htmlFor={htmlFor} className="block text-sm font-medium">
      {label}
      {required ? <span aria-hidden="true"> *</span> : null}
      {hint ? <span className="ml-2 font-normal text-muted-foreground">{hint}</span> : null}
    </label>
  );
}

export function TextInput({
  id,
  name,
  defaultValue,
  type = "text",
  placeholder,
  required = false,
  min,
  max,
  step,
  onChange,
}: {
  id: string;
  name: string;
  defaultValue?: string | number | null;
  type?: "text" | "email" | "url" | "date" | "datetime-local" | "number";
  placeholder?: string;
  required?: boolean;
  min?: number;
  max?: number;
  step?: number;
  onChange?: ChangeEventHandler<HTMLInputElement>;
}) {
  return (
    <input
      id={id}
      name={name}
      type={type}
      defaultValue={defaultValue ?? ""}
      placeholder={placeholder}
      required={required}
      min={min}
      max={max}
      step={step}
      onChange={onChange}
      className="mt-2 block w-full rounded-md border border-border bg-background px-3 py-2.5 text-sm outline-none transition-colors placeholder:text-faint-foreground focus:border-foreground"
    />
  );
}

export function TextArea({
  id,
  name,
  defaultValue,
  placeholder,
  required = false,
  rows = 4,
}: {
  id: string;
  name: string;
  defaultValue?: string | null;
  placeholder?: string;
  required?: boolean;
  rows?: number;
}) {
  return (
    <textarea
      id={id}
      name={name}
      defaultValue={defaultValue ?? ""}
      placeholder={placeholder}
      required={required}
      rows={rows}
      className="mt-2 block w-full resize-y rounded-md border border-border bg-background px-3 py-2.5 text-sm leading-6 outline-none transition-colors placeholder:text-faint-foreground focus:border-foreground"
    />
  );
}

export function SelectInput({
  id,
  name,
  defaultValue,
  children,
  required = false,
  onChange,
}: {
  id: string;
  name: string;
  defaultValue?: string | null;
  children: ReactNode;
  required?: boolean;
  onChange?: ChangeEventHandler<HTMLSelectElement>;
}) {
  return (
    <select
      id={id}
      name={name}
      defaultValue={defaultValue ?? ""}
      required={required}
      onChange={onChange}
      className="mt-2 block w-full rounded-md border border-border bg-background px-3 py-2.5 text-sm outline-none focus:border-foreground"
    >
      {children}
    </select>
  );
}

export function FormSection({
  title,
  description,
  children,
}: {
  title: string;
  description?: string;
  children: ReactNode;
}) {
  return (
    <section className="border-t border-border pt-8">
      <h2 className="text-xs font-medium uppercase tracking-widest text-muted-foreground">{title}</h2>
      {description ? <p className="mt-2 text-sm leading-6 text-muted-foreground">{description}</p> : null}
      <div className="mt-5">{children}</div>
    </section>
  );
}
