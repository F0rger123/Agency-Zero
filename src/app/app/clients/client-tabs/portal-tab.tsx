"use client";

import { useActionState, useState } from "react";
import { ConfirmDelete } from "@/components/confirm-delete";
import { FormMessage, FormSection } from "@/components/form-controls";
import type { ActionState } from "@/lib/forms";
import { setClientPortalAction } from "../actions";
import type { ClientWorkspaceData } from "../client-workspace-types";

export type ClientPortal = { enabled: boolean; token: string | null };

const initialState: ActionState = {};

function PortalSwitch({ clientId, mode, children, outline = false }: { clientId: string; mode: "enable" | "disable"; children: string; outline?: boolean }) {
  const [state, action, pending] = useActionState(setClientPortalAction, initialState);
  return (
    <form action={action} className="flex flex-wrap items-center gap-3">
      <input type="hidden" name="client_id" value={clientId} />
      <input type="hidden" name="mode" value={mode} />
      <button
        type="submit"
        disabled={pending}
        className={`press rounded-md px-4 py-2 text-sm font-medium transition-[opacity,background-color] disabled:opacity-50 ${
          outline ? "border border-border hover:bg-muted" : "bg-inverted text-inverted-foreground hover:opacity-80"
        }`}
      >
        {pending ? "Saving…" : children}
      </button>
      <FormMessage {...state} />
    </form>
  );
}

function CopyLink({ link }: { link: string }) {
  const [copied, setCopied] = useState(false);
  return (
    <div className="flex flex-col gap-2 sm:flex-row">
      <input readOnly value={link} aria-label="Portal link" onFocus={(event) => event.currentTarget.select()} className="min-w-0 flex-1 rounded-md border border-border bg-muted/40 px-3 py-2.5 font-mono text-xs outline-none" />
      <button
        type="button"
        onClick={async () => {
          try {
            await navigator.clipboard.writeText(link);
            setCopied(true);
            window.setTimeout(() => setCopied(false), 1800);
          } catch {
            // Clipboard blocked: the field above is selectable.
          }
        }}
        className="press shrink-0 rounded-md border border-border px-4 py-2 text-sm font-medium transition-colors hover:bg-muted"
      >
        {copied ? "Copied" : "Copy link"}
      </button>
    </div>
  );
}

/**
 * The private page a client opens to see their proposals, estimates, contracts and invoices.
 * Everything on it comes from records already in the CRM; accepting or signing there updates the CRM by itself.
 */
export function PortalTab({ data, portal, siteUrl }: { data: ClientWorkspaceData; portal: ClientPortal | null; siteUrl: string }) {
  const sent = data.quotes.filter((quote) => ["sent", "viewed"].includes(quote.status)).length;
  const answered = data.quotes.filter((quote) => ["accepted", "rejected"].includes(quote.status)).length;
  const contractsOut = data.contracts.filter((contract) => contract.status === "sent").length;
  const contractsSigned = data.contracts.filter((contract) => contract.status === "signed").length;
  const invoices = data.invoices.filter((invoice) => invoice.status !== "draft" && invoice.status !== "void").length;
  const base = siteUrl || (typeof window !== "undefined" ? window.location.origin : "");
  const link = portal?.token ? `${base}/p/${portal.token}` : "";

  return (
    <FormSection title="Client portal" description="One private link for this customer. They see what is waiting on them, can review and accept or sign, and every response lands here automatically.">
      {portal === null ? (
        <p className="text-sm text-muted-foreground">
          The client portal needs database update <code className="font-mono text-foreground">0027</code>. Apply it in the Supabase SQL editor and reload.
        </p>
      ) : (
        <div className="space-y-8">
          {portal.enabled && link ? (
            <div className="space-y-4">
              <CopyLink link={link} />
              <div className="flex flex-wrap items-center gap-3">
                <a href={`/p/${portal.token}`} target="_blank" rel="noreferrer" className="press rounded-md bg-inverted px-4 py-2 text-sm font-medium text-inverted-foreground transition-opacity hover:opacity-80">
                  Preview as the client ↗
                </a>
                <PortalSwitch clientId={data.client.id} mode="disable" outline>
                  Turn off
                </PortalSwitch>
                <RegenerateLink clientId={data.client.id} />
              </div>
            </div>
          ) : (
            <div className="space-y-3">
              <p className="text-sm text-muted-foreground">{portal.token ? "The portal is off. The old link will not open until you turn it back on." : "No portal yet."}</p>
              <PortalSwitch clientId={data.client.id} mode="enable">
                {portal.token ? "Turn portal on" : "Create portal link"}
              </PortalSwitch>
            </div>
          )}

          <div>
            <h3 className="text-xs font-medium uppercase tracking-widest text-muted-foreground">What they will see</h3>
            <dl className="mt-3 grid grid-cols-2 gap-3 text-sm sm:grid-cols-4">
              {[
                ["Waiting on them", sent + contractsOut],
                ["Quotes and estimates answered", answered],
                ["Contracts signed", contractsSigned],
                ["Invoices", invoices],
              ].map(([label, value]) => (
                <div key={String(label)} className="rounded-xl border border-border p-4">
                  <dd className="text-2xl font-semibold tracking-tight">{value}</dd>
                  <dt className="mt-1 text-xs text-muted-foreground">{label}</dt>
                </div>
              ))}
            </dl>
            <p className="mt-4 text-sm text-muted-foreground">
              A quote, estimate or contract appears on the portal once its status is <strong className="text-foreground">Sent</strong>. Drafts and internal records are never shown.
            </p>
          </div>
        </div>
      )}
    </FormSection>
  );
}

function RegenerateLink({ clientId }: { clientId: string }) {
  return (
    <ConfirmDelete
      action={setClientPortalAction}
      fields={{ client_id: clientId, mode: "regenerate" }}
      label="Make a new link"
      title="Make a new portal link?"
      message="The current link stops working straight away. Send the new one to your client."
      confirmLabel="Make new link"
      className="rounded-md border border-border px-4 py-2 text-sm text-foreground hover:bg-muted"
    />
  );
}
