import type { Metadata } from "next";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { isMissingTable } from "@/lib/forms";
import { dateTimeLabel } from "@/lib/format";
import { PageHeader } from "@/components/page-header";
import { LimitNotice, MigrationsRequired, SetupRequired } from "@/components/states";
import { LIST_LIMIT } from "@/lib/limits";
import { looksLikeTestLead } from "@/lib/leads";
import { ConfirmDelete } from "@/components/confirm-delete";
import { ConvertLeadForm, LeadStatusForm } from "./lead-forms";
import { deleteDismissedLeadsAction, deleteLeadAction } from "./actions";

export const metadata: Metadata = { title: "Leads" };

type Lead = {
  id: string;
  name: string;
  business: string | null;
  email: string | null;
  phone: string | null;
  services: string[];
  budget: string | null;
  details: string | null;
  status: "new" | "contacted" | "converted" | "dismissed";
  client_id: string | null;
  created_at: string;
};

const SERVICE_LABEL: Record<string, string> = {
  software: "Custom software / CRM",
  websites: "Website",
  seo: "SEO",
  "meta-ads": "Meta ads",
  social: "Social media",
  content: "Video / content",
  "not-sure": "Not sure yet",
};

/** Inbound project inquiries from the public website's contact form. */
export default async function LeadsPage({ searchParams }: { searchParams: Promise<{ status?: string }> }) {
  if (!isSupabaseConfigured()) return <SetupRequired />;
  const { status: filter } = await searchParams;
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("leads")
    .select("id, name, business, email, phone, services, budget, details, status, client_id, created_at")
    .order("created_at", { ascending: false })
    .limit(LIST_LIMIT);

  if (error) {
    if (isMissingTable(error.message)) return <MigrationsRequired detail="Leads need migration 0019." />;
    throw new Error(error.message);
  }

  const leads = (data ?? []) as Lead[];
  const tabs = ["all", "new", "contacted", "converted", "dismissed"] as const;
  const active = (tabs as readonly string[]).includes(filter ?? "") ? (filter as (typeof tabs)[number]) : "all";
  const shown = active === "all" ? leads : leads.filter((lead) => lead.status === active);
  const count = (s: string) => (s === "all" ? leads.length : leads.filter((lead) => lead.status === s).length);

  return (
    <>
      <PageHeader
        title="Leads"
        description="Project inquiries submitted through the public website. Convert a lead to create the client and primary contact."
      />
      <LimitNotice shown={leads.length} limit={LIST_LIMIT} hint="Older leads are hidden." />

      {count("dismissed") > 0 ? (
        <div className="mb-4 flex justify-end">
          <ConfirmDelete
            action={deleteDismissedLeadsAction}
            fields={{}}
            label={`Delete all dismissed (${count("dismissed")})`}
            title="Delete all dismissed leads?"
            message="This permanently removes every dismissed lead. Leads you already turned into clients are not touched. This cannot be undone."
            confirmLabel="Delete dismissed"
          />
        </div>
      ) : null}

      <nav aria-label="Lead status" className="flex flex-wrap gap-x-6 gap-y-2 border-b border-border pb-3 text-sm">
        {tabs.map((tab) => (
          <Link
            key={tab}
            href={`/app/leads?status=${tab}`}
            aria-current={tab === active ? "page" : undefined}
            className={`capitalize underline-offset-4 ${
              tab === active ? "font-medium underline decoration-foreground" : "text-muted-foreground hover:text-foreground"
            }`}
          >
            {tab} <span className="text-faint-foreground">{count(tab)}</span>
          </Link>
        ))}
      </nav>

      {shown.length === 0 ? (
        <p className="mt-8 border-y border-border py-10 text-sm text-muted-foreground">
          {leads.length === 0 ? "No leads yet. They appear here when someone submits the website contact form." : `No ${active} leads.`}
        </p>
      ) : (
        <ul className="divide-y divide-border border-b border-border">
          {shown.map((lead) => (
            <li key={lead.id} className="grid gap-6 py-7 md:grid-cols-12">
              <div className="md:col-span-4">
                <p className="font-medium">
                  {lead.name}
                  {lead.business ? <span className="text-muted-foreground"> · {lead.business}</span> : null}
                </p>
                {lead.email ? (
                  <p className="mt-1 text-sm">
                    <a href={`mailto:${lead.email}`} className="underline decoration-border underline-offset-4">
                      {lead.email}
                    </a>
                  </p>
                ) : null}
                {lead.phone ? (
                  <p className={`mt-1 text-sm ${lead.email ? "text-muted-foreground" : ""}`}>
                    <a href={`tel:${lead.phone.replace(/[^+\d]/g, "")}`} className="underline decoration-border underline-offset-4">
                      {lead.phone}
                    </a>
                    {lead.email ? null : <span className="ml-2 text-xs text-muted-foreground">phone only</span>}
                  </p>
                ) : null}
                <p className="mt-3 text-xs text-faint-foreground">
                  {dateTimeLabel(lead.created_at)} · <span className="uppercase tracking-widest">{lead.status}</span>
                </p>
                {looksLikeTestLead(lead) ? (
                  <p className="mt-2 inline-block rounded-full border border-border px-2 py-0.5 text-[11px] text-muted-foreground">
                    Looks like a test
                  </p>
                ) : null}
              </div>

              <div className="md:col-span-5">
                <p className="text-sm">
                  {lead.services.length ? lead.services.map((s) => SERVICE_LABEL[s] ?? s).join(" · ") : "No service selected"}
                </p>
                {lead.budget ? <p className="mt-1 text-sm text-muted-foreground">Budget: {lead.budget}</p> : null}
                {lead.details ? <p className="mt-3 whitespace-pre-wrap text-sm leading-6 text-muted-foreground">{lead.details}</p> : null}
              </div>

              <div className="space-y-3 md:col-span-3">
                <ConfirmDelete
                  action={deleteLeadAction}
                  fields={{ id: lead.id }}
                  title="Delete this lead?"
                  message={`This permanently removes ${lead.name}'s inquiry. This cannot be undone.`}
                  className="text-xs text-red-600 hover:text-red-700"
                />
                {lead.client_id ? (
                  <Link href={`/app/clients/${lead.client_id}`} className="text-sm underline decoration-border underline-offset-4">
                    Open client →
                  </Link>
                ) : (
                  <>
                    <ConvertLeadForm id={lead.id} />
                    <div className="flex gap-5">
                      {lead.status !== "contacted" ? <LeadStatusForm id={lead.id} status="contacted" label="Mark contacted" /> : null}
                      {lead.status !== "dismissed" ? <LeadStatusForm id={lead.id} status="dismissed" label="Dismiss" /> : null}
                      {lead.status === "dismissed" ? <LeadStatusForm id={lead.id} status="new" label="Reopen" /> : null}
                    </div>
                  </>
                )}
              </div>
            </li>
          ))}
        </ul>
      )}
    </>
  );
}
