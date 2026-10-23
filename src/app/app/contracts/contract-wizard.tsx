"use client";

import Link from "next/link";
import { useActionState, useEffect, useMemo, useRef, useState } from "react";
import { useFormStatus } from "react-dom";
import { FormMessage } from "@/components/form-controls";
import { useModal } from "@/components/modal";
import { Wizard } from "@/components/wizard";
import {
  WORK_TYPES,
  buildContractBody,
  feeBlock,
  feeBlockFromQuote,
  longDate,
  suggestWorkType,
  workType,
  type ContractVars,
  type QuoteFeeLine,
  type WorkTypeKey,
} from "@/lib/contract-library";
import { createContractFromWizardAction, getContractContextAction, markContractSentAction, getQuoteFeeLinesAction, type ContractContext, type WizardContractState } from "./actions";

type Option = { id: string; label: string };
const plain =
  "block w-full rounded-md border border-border bg-background px-3 py-2.5 text-sm outline-none transition-colors placeholder:text-faint-foreground focus:border-foreground";
const label = "text-xs font-medium text-muted-foreground";
const cents = (value: string) => {
  const amount = Number(value);
  return Number.isFinite(amount) && amount > 0 ? Math.round(amount * 100) : 0;
};

function Choice({ selected, onClick, title, hint, badge }: { selected: boolean; onClick: () => void; title: string; hint?: string; badge?: string }) {
  return (
    <button
      type="button"
      role="radio"
      aria-checked={selected}
      onClick={onClick}
      className={`press relative rounded-xl border p-3.5 text-left transition-colors ${selected ? "border-foreground bg-muted" : "border-border hover:bg-muted"}`}
    >
      <span className="block pr-14 text-sm font-medium">{title}</span>
      {hint ? <span className="mt-0.5 block text-xs leading-5 text-muted-foreground">{hint}</span> : null}
      {badge ? <span className="absolute right-3 top-3 rounded-full bg-foreground px-2 py-0.5 text-[10px] font-medium uppercase tracking-wider text-background">{badge}</span> : null}
    </button>
  );
}

function Money({ id, text, value, onChange }: { id: string; text: string; value: string; onChange: (value: string) => void }) {
  return (
    <div>
      <label htmlFor={id} className={label}>{text}</label>
      <div className="relative mt-1">
        <span aria-hidden className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">$</span>
        <input id={id} type="number" inputMode="decimal" min={0} step={0.01} value={value} onChange={(event) => onChange(event.target.value)} className={`${plain} pl-7`} />
      </div>
    </div>
  );
}

function Pills<T extends string | number>({ name, value, options, onChange, format = String }: { name: string; value: T; options: T[]; onChange: (value: T) => void; format?: (value: T) => string }) {
  return (
    <div className="mt-1 flex flex-wrap gap-2" role="radiogroup" aria-label={name}>
      {options.map((option) => (
        <button
          key={String(option)}
          type="button"
          role="radio"
          aria-checked={value === option}
          onClick={() => onChange(option)}
          className={`press rounded-full border px-3.5 py-1.5 text-sm transition-colors ${value === option ? "border-foreground bg-foreground text-background" : "border-border hover:bg-muted"}`}
        >
          {format(option)}
        </button>
      ))}
    </div>
  );
}

/**
 * Create contract, step by step: customer → type of work (suggested from their services) → what the work is → fees and terms
 * → review and edit the finished text → save, and get the link the customer signs through.
 */
export function NewContractWizard({ clients, lockedClientId }: { clients: Option[]; lockedClientId?: string }) {
  const [state, action] = useActionState<WizardContractState, FormData>(createContractFromWizardAction, {});
  const [clientId, setClientId] = useState(lockedClientId ?? "");
  const [ctx, setCtx] = useState<ContractContext | null>(null);
  const [typeKey, setTypeKey] = useState<WorkTypeKey | "">("");
  const [scope, setScope] = useState("");
  const [quoteId, setQuoteId] = useState("");
  const [quoteLines, setQuoteLines] = useState<QuoteFeeLine[] | null>(null);
  const [quoteError, setQuoteError] = useState("");
  const [project, setProject] = useState("");
  const [deposit, setDeposit] = useState(50);
  const [monthly, setMonthly] = useState("");
  const [setup, setSetup] = useState("");
  const [hourly, setHourly] = useState("");
  const [paymentDays, setPaymentDays] = useState(14);
  const [noticeDays, setNoticeDays] = useState(30);
  const [termMonths, setTermMonths] = useState(1);
  const [state_, setStateName] = useState("Pennsylvania");
  const [businessEmail, setBusinessEmail] = useState("");
  const [titleEdit, setTitleEdit] = useState<string | null>(null);
  const [bodyEdit, setBodyEdit] = useState<string | null>(null);
  const loaded = useRef("");
  const picked = useRef(false);

  // Load what we know about the customer whenever the customer changes.
  useEffect(() => {
    if (!clientId || loaded.current === clientId) return;
    loaded.current = clientId;
    let live = true;
    getContractContextAction(clientId).then((result) => {
      if (!live) return;
      setCtx(result);
      const suggestion = suggestWorkType(result.serviceNames ?? [], Boolean(result.hasRecurring));
      if (!picked.current && suggestion) {
        const next = workType(suggestion);
        setTypeKey(suggestion);
        setScope(next.defaultScope);
        setTermMonths(next.defaultTermMonths);
        setDeposit(next.fee === "project" ? 50 : 0);
      }
    });
    return () => {
      live = false;
    };
  }, [clientId]);

  const suggestion = ctx?.client ? suggestWorkType(ctx.serviceNames ?? [], Boolean(ctx.hasRecurring)) : null;
  const info = typeKey ? workType(typeKey) : null;

  const chooseType = (key: WorkTypeKey) => {
    const next = workType(key);
    picked.current = true;
    setTypeKey(key);
    setScope(next.defaultScope);
    setTermMonths(next.defaultTermMonths);
    setDeposit(next.fee === "project" ? 50 : 0);
  };
  const chooseQuote = async (id: string) => {
    setQuoteId(id);
    setQuoteError("");
    setQuoteLines(null);
    if (!id) return;
    const result = await getQuoteFeeLinesAction(id);
    if (result.error) setQuoteError(result.error);
    else setQuoteLines(result.lines ?? []);
  };

  const vars: ContractVars | null = useMemo(() => {
    if (!ctx?.client || !info) return null;
    const fees =
      quoteId && quoteLines
        ? feeBlockFromQuote(quoteLines, paymentDays, info.fee === "project" ? deposit : 0)
        : feeBlock(info.fee, { projectCents: cents(project), depositPercent: deposit, monthlyCents: cents(monthly), setupCents: cents(setup), hourlyCents: cents(hourly) }, paymentDays);
    return {
      businessName: ctx.business?.name ?? "Agency Zero",
      businessEmail: businessEmail.trim(),
      clientName: ctx.client.name,
      clientCompany: ctx.client.company ?? "",
      clientEmail: ctx.client.email ?? "",
      clientPhone: ctx.client.phone ?? "",
      clientWebsite: ctx.client.website ?? "",
      date: longDate(),
      scope,
      fees,
      paymentDays,
      noticeDays,
      termMonths,
      revisionRounds: 2,
      warrantyDays: 30,
      state: state_.trim() || "Pennsylvania",
    };
  }, [ctx, info, quoteId, quoteLines, paymentDays, deposit, project, monthly, setup, hourly, scope, noticeDays, termMonths, state_, businessEmail]);

  const defaultTitle = info && ctx?.client ? `${info.name}: ${ctx.client.company || ctx.client.name}` : "";
  const title = titleEdit ?? defaultTitle;
  const generated = vars && typeKey ? buildContractBody(typeKey, vars, title) : "";
  const body = bodyEdit ?? generated;
  const word = typeKey === "nda" ? "agreement" : "contract";

  if (state.link) return <Sent state={state} email={ctx?.client?.email ?? ""} phone={ctx?.client?.phone ?? ""} title={title} name={ctx?.client?.name ?? ""} />;

  const loading = Boolean(clientId) && !ctx;
  const missing = ctx?.client ? [!ctx.client.email && "email", !ctx.client.phone && "phone", !ctx.client.company && "company"].filter(Boolean) : [];

  return (
    <form action={action}>
      <input type="hidden" name="client_id" value={clientId} />
      <input type="hidden" name="quote_id" value={quoteId} />
      <input type="hidden" name="title" value={title} />
      <Wizard
        compact
        steps={[
          {
            title: "Who is it for?",
            hint: "We fill in their name, company, email, phone and website for you.",
            content: (
              <div className="space-y-4">
                {lockedClientId ? (
                  <p className="rounded-xl border border-border px-4 py-3 text-sm font-medium">{clients.find((client) => client.id === lockedClientId)?.label ?? "This customer"}</p>
                ) : (
                  <div>
                    <label htmlFor="ncw-client" className={label}>Customer</label>
                    <select
                      id="ncw-client"
                      required
                      value={clientId}
                      onChange={(event) => {
                        setCtx(null);
                        picked.current = false;
                        setTypeKey("");
                        setQuoteId("");
                        setQuoteLines(null);
                        setBodyEdit(null);
                        setTitleEdit(null);
                        setClientId(event.target.value);
                      }}
                      className={`${plain} mt-1`}
                    >
                      <option value="">Choose a customer</option>
                      {clients.map((client) => (
                        <option key={client.id} value={client.id}>{client.label}</option>
                      ))}
                    </select>
                  </div>
                )}
                {loading ? <p className="text-sm text-muted-foreground">Loading their details…</p> : null}
                {ctx?.error ? <p role="alert" className="text-sm font-medium">{ctx.error}</p> : null}
                {ctx?.client ? (
                  <dl className="divide-y divide-border rounded-xl border border-border text-sm">
                    {[
                      ["Name", ctx.client.name],
                      ["Company", ctx.client.company],
                      ["Email", ctx.client.email],
                      ["Phone", ctx.client.phone],
                      ["Website", ctx.client.website],
                    ].map(([name, value]) => (
                      <div key={name} className="flex justify-between gap-4 px-4 py-2.5">
                        <dt className="text-muted-foreground">{name}</dt>
                        <dd className={`text-right ${value ? "font-medium" : "text-muted-foreground"}`}>{value || "Not on file"}</dd>
                      </div>
                    ))}
                  </dl>
                ) : null}
                {missing.includes("email") ? <p className="text-xs text-muted-foreground">No email on file. You can still copy the link and send it yourself.</p> : null}
              </div>
            ),
          },
          {
            title: "What kind of work?",
            hint: suggestion ? "We picked the best match from their services. Change it if it is wrong." : "Pick the closest match. Each one has the right protections built in.",
            content: (
              <div className="space-y-3">
                <input required readOnly tabIndex={-1} aria-hidden value={typeKey} className="sr-only" />
                {loading ? <p className="text-sm text-muted-foreground">Loading…</p> : null}
                <div className="grid gap-2 sm:grid-cols-2" role="radiogroup" aria-label="Type of work">
                  {WORK_TYPES.map((type) => (
                    <Choice key={type.key} selected={typeKey === type.key} onClick={() => chooseType(type.key)} title={type.name} hint={type.summary} badge={suggestion === type.key ? "Suggested" : undefined} />
                  ))}
                </div>
              </div>
            ),
          },
          {
            title: typeKey === "nda" ? "What are you discussing?" : "What is the work?",
            hint: typeKey === "general" ? "Describe the work in your own words. Replace anything in [brackets]." : "This is prefilled. Replace anything in [brackets] and edit freely.",
            content: (
              <div className="space-y-3">
                {ctx?.serviceNames && ctx.serviceNames.length > 0 ? (
                  <p className="text-xs text-muted-foreground">Their services: {ctx.serviceNames.join(", ")}</p>
                ) : null}
                <label htmlFor="ncw-scope" className="sr-only">Scope</label>
                <textarea id="ncw-scope" required rows={7} value={scope} onChange={(event) => setScope(event.target.value)} className={`${plain} resize-y text-base leading-6`} />
                {scope.includes("[") ? <p className="text-xs text-muted-foreground">There are still [brackets] to fill in.</p> : null}
              </div>
            ),
          },
          {
            title: "Fees and terms",
            hint: info?.fee === "none" ? "No fees for this one. Just confirm the terms." : "Used to write the payment section. You can edit the text on the next screen.",
            content: (
              <div className="space-y-5">
                {info && info.fee !== "none" && (ctx?.quotes?.length ?? 0) > 0 ? (
                  <div>
                    <label htmlFor="ncw-quote" className={label}>Use the prices from a quote (optional)</label>
                    <select id="ncw-quote" value={quoteId} onChange={(event) => void chooseQuote(event.target.value)} className={`${plain} mt-1`}>
                      <option value="">No, I will type the amount</option>
                      {ctx?.quotes?.map((quote) => (
                        <option key={quote.id} value={quote.id}>{quote.title} ({quote.status})</option>
                      ))}
                    </select>
                    {quoteError ? <p role="alert" className="mt-1 text-xs font-medium">{quoteError}</p> : null}
                  </div>
                ) : null}
                {info && !quoteId && info.fee === "project" ? <Money id="ncw-project" text="Total project price" value={project} onChange={setProject} /> : null}
                {info && !quoteId && info.fee === "monthly" ? (
                  <>
                    <Money id="ncw-monthly" text="Monthly fee" value={monthly} onChange={setMonthly} />
                    <Money id="ncw-setup" text="One-time setup fee (optional)" value={setup} onChange={setSetup} />
                  </>
                ) : null}
                {info && !quoteId && info.fee === "hourly" ? <Money id="ncw-hourly" text="Hourly rate" value={hourly} onChange={setHourly} /> : null}
                {info?.fee === "project" ? (
                  <div>
                    <p className={label}>Deposit due when they sign</p>
                    <Pills name="Deposit" value={deposit} options={[0, 25, 50, 100]} onChange={setDeposit} format={(value) => (value === 0 ? "None" : `${value}%`)} />
                  </div>
                ) : null}
                {info && info.fee !== "none" ? (
                  <div>
                    <p className={label}>Invoices are due within</p>
                    <Pills name="Payment days" value={paymentDays} options={[7, 14, 30]} onChange={setPaymentDays} format={(value) => `${value} days`} />
                  </div>
                ) : null}
                {info?.recurring ? (
                  <div>
                    <p className={label}>Minimum commitment</p>
                    <Pills name="Minimum commitment" value={termMonths} options={[1, 3, 6, 12]} onChange={setTermMonths} format={(value) => (value === 1 ? "Month to month" : `${value} months`)} />
                  </div>
                ) : null}
                {info && info.fee !== "none" ? (
                  <div>
                    <p className={label}>Notice to end the agreement</p>
                    <Pills name="Notice" value={noticeDays} options={[14, 30, 60]} onChange={setNoticeDays} format={(value) => `${value} days`} />
                  </div>
                ) : null}
                <div>
                  <label htmlFor="ncw-bizemail" className={label}>Your email for notices (shown in the contract, optional)</label>
                  <input id="ncw-bizemail" type="email" value={businessEmail} onChange={(event) => setBusinessEmail(event.target.value)} placeholder="you@yourbusiness.com" className={`${plain} mt-1`} />
                </div>
                <div>
                  <label htmlFor="ncw-state" className={label}>Whose state&apos;s laws apply?</label>
                  <input id="ncw-state" value={state_} onChange={(event) => setStateName(event.target.value)} className={`${plain} mt-1`} />
                </div>
              </div>
            ),
          },
          {
            title: `Review your ${word}`,
            hint: "This is the finished text with everything filled in. Edit anything you like.",
            content: (
              <div className="space-y-3">
                <div>
                  <label htmlFor="ncw-title" className={label}>Name</label>
                  <input id="ncw-title" required value={title} onChange={(event) => setTitleEdit(event.target.value)} className={`${plain} mt-1`} />
                </div>
                <div>
                  <label htmlFor="ncw-body" className={label}>Text the customer will read and sign</label>
                  <textarea id="ncw-body" name="body" required rows={16} value={body} onChange={(event) => setBodyEdit(event.target.value)} className={`${plain} mt-1 resize-y font-mono text-[13px] leading-6`} />
                </div>
                {bodyEdit !== null ? (
                  <button type="button" onClick={() => setBodyEdit(null)} className="text-xs text-muted-foreground underline underline-offset-4 hover:text-foreground">
                    Start over from the template (discards your edits)
                  </button>
                ) : null}
                {body.includes("[") ? <p className="text-xs font-medium">There are still [brackets] in the text. Fill them in before sending.</p> : null}
                <p className="text-xs leading-5 text-muted-foreground">
                  These templates are general starting points that cover the usual protections for both sides. They are not legal advice. Have a lawyer review them before you rely on them, especially for larger or riskier work.
                </p>
              </div>
            ),
          },
        ]}
        finish={
          <div className="flex flex-wrap items-center gap-3">
            <FinishButton value="1">Create and get signing link</FinishButton>
            <FinishButton value="0" outline>Save as draft</FinishButton>
            <FormMessage {...state} />
          </div>
        }
      />
    </form>
  );
}

/** A submit button that says whether to send the contract (value 1) or keep it as a draft (value 0). */
function FinishButton({ value, outline = false, children }: { value: string; outline?: boolean; children: React.ReactNode }) {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      name="send"
      value={value}
      disabled={pending}
      className={`press rounded-md px-4 py-2 text-sm font-medium transition-opacity disabled:cursor-wait disabled:opacity-50 ${outline ? "border border-border hover:bg-muted" : "bg-inverted text-inverted-foreground hover:opacity-80"}`}
    >
      {pending ? "Saving…" : children}
    </button>
  );
}

/** Shown after saving: the link the customer signs through, with easy ways to send it. */
function Sent({ state, email, phone, title, name }: { state: WizardContractState; email: string; phone: string; title: string; name: string }) {
  const modal = useModal();
  const [copied, setCopied] = useState("");
  const link = state.link ?? "";
  const message = `Hi ${name.split(" ")[0] || "there"}, here is the agreement for you to review and sign: ${link}`;
  const copy = async () => {
    try {
      await navigator.clipboard.writeText(link);
      setCopied("Copied.");
    } catch {
      setCopied("Select the link and copy it.");
    }
  };
  return (
    <div className="space-y-5">
      <div>
        <p className="text-lg font-semibold tracking-tight">{state.sent ? "Ready to send." : "Saved as a draft."}</p>
        <p className="mt-1 text-sm text-muted-foreground">
          {state.sent
            ? "Send the customer this link. They read it and sign with their name. The signed copy is saved in the CRM automatically."
            : "The link only works once you mark it as sent from the contract page."}
        </p>
      </div>
      <div className="flex gap-2">
        <input readOnly value={link} aria-label="Signing link" onFocus={(event) => event.currentTarget.select()} className="w-full rounded-md border border-border bg-muted px-3 py-2.5 font-mono text-xs" />
        <button type="button" onClick={copy} className="press shrink-0 rounded-md bg-inverted px-4 text-sm font-medium text-inverted-foreground hover:opacity-80">Copy</button>
      </div>
      {copied ? <p role="status" className="text-xs text-muted-foreground">{copied}</p> : null}
      <div className="flex flex-wrap gap-2">
        {email ? (
          <a href={`mailto:${email}?subject=${encodeURIComponent(title)}&body=${encodeURIComponent(message)}`} className="press rounded-full border border-border px-4 py-2 text-sm hover:bg-muted">Email it</a>
        ) : null}
        {phone ? (
          <a href={`sms:${phone.replace(/[^+\d]/g, "")}?&body=${encodeURIComponent(message)}`} className="press rounded-full border border-border px-4 py-2 text-sm hover:bg-muted">Text it</a>
        ) : null}
        {state.id ? <Link href={`/app/contracts/${state.id}`} onClick={() => modal?.close()} className="press rounded-full border border-border px-4 py-2 text-sm hover:bg-muted">Open contract</Link> : null}
      </div>
      <button type="button" onClick={() => modal?.close()} className="text-sm text-muted-foreground underline underline-offset-4 hover:text-foreground">Done</button>
    </div>
  );
}

/** On the contract page: copy the signing link, send it by email or text, and mark a draft as sent. */
export function ContractSendPanel({ id, link, status, email, phone, title, name }: { id: string; link: string; status: string; email: string; phone: string; title: string; name: string }) {
  const [copied, setCopied] = useState("");
  const [state, action] = useActionState(markContractSentAction, {});
  const message = `Hi ${name.split(" ")[0] || "there"}, here is the agreement for you to review and sign: ${link}`;
  const copy = async () => {
    try {
      await navigator.clipboard.writeText(link);
      setCopied("Copied.");
    } catch {
      setCopied("Select the link and copy it.");
    }
  };
  return (
    <div className="space-y-4">
      <div className="flex gap-2">
        <input readOnly value={link} aria-label="Signing link" onFocus={(event) => event.currentTarget.select()} className="w-full rounded-md border border-border bg-muted px-3 py-2.5 font-mono text-xs" />
        <button type="button" onClick={copy} className="press shrink-0 rounded-md bg-inverted px-4 text-sm font-medium text-inverted-foreground hover:opacity-80">Copy</button>
      </div>
      {copied ? <p role="status" className="text-xs text-muted-foreground">{copied}</p> : null}
      <div className="flex flex-wrap items-center gap-2">
        {email ? <a href={`mailto:${email}?subject=${encodeURIComponent(title)}&body=${encodeURIComponent(message)}`} className="press rounded-full border border-border px-4 py-2 text-sm hover:bg-muted">Email it</a> : null}
        {phone ? <a href={`sms:${phone.replace(/[^+\d]/g, "")}?&body=${encodeURIComponent(message)}`} className="press rounded-full border border-border px-4 py-2 text-sm hover:bg-muted">Text it</a> : null}
        {status === "draft" ? (
          <form action={action} className="flex items-center gap-3">
            <input type="hidden" name="id" value={id} />
            <FinishButton value="1">Mark as sent</FinishButton>
            <FormMessage {...state} />
          </form>
        ) : null}
      </div>
      {status === "draft" ? <p className="text-xs text-muted-foreground">The link only works for signing once the contract is marked as sent.</p> : null}
    </div>
  );
}
