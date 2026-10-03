import type { Metadata } from "next";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { isMissingTable } from "@/lib/forms";
import { LIST_LIMIT, PICKER_LIMIT } from "@/lib/limits";
import { dateLabel, moneyLabel } from "@/lib/format";
import { PageHeader } from "@/components/page-header";
import { FormSection } from "@/components/form-controls";
import { DataFailure, MigrationsRequired, SetupRequired } from "@/components/states";
import { channelLabels, CampaignResultsForm, DeleteCampaignForm, NewCampaignForm, statusLabels } from "./campaign-forms";

export const metadata: Metadata = { title: "Marketing" };

type Campaign = {
  id: string;
  client_id: string;
  name: string;
  channel: string;
  status: string;
  objective: string | null;
  starts_on: string | null;
  ends_on: string | null;
  budget_cents: number | null;
  spend_cents: number;
  leads_count: number;
  results_note: string | null;
  clients: { name: string } | { name: string }[] | null;
};

/**
 * Marketing: campaigns per client with budget, spend and results entered by hand.
 * (Live ad-platform numbers arrive with the integrations phase; this is the working tracker until then.)
 */
export default async function MarketingPage() {
  if (!isSupabaseConfigured()) return <SetupRequired />;
  const supabase = await createClient();
  const [campaignsResponse, clientsResponse] = await Promise.all([
    supabase
      .from("marketing_campaigns")
      .select("id, client_id, name, channel, status, objective, starts_on, ends_on, budget_cents, spend_cents, leads_count, results_note, clients(name)")
      .order("created_at", { ascending: false })
      .limit(LIST_LIMIT),
    supabase.from("clients").select("id, name, company").is("deleted_at", null).order("name").limit(PICKER_LIMIT),
  ]);
  const header = (
    <PageHeader
      title="Marketing"
      description="Track every campaign you run for clients: channel, budget, spend and the leads it produced."
    />
  );
  if (campaignsResponse.error) {
    return (
      <>
        {header}
        {isMissingTable(campaignsResponse.error.message) ? (
          <MigrationsRequired detail="Marketing needs database update 0021 (supabase/scripts/apply)." />
        ) : (
          <DataFailure title="Marketing" message={campaignsResponse.error.message} />
        )}
      </>
    );
  }
  const campaigns = (campaignsResponse.data ?? []) as Campaign[];
  const clients = (clientsResponse.data ?? []) as { id: string; name: string; company: string | null }[];
  const active = campaigns.filter((campaign) => campaign.status === "active");
  const spend = campaigns.reduce((sum, campaign) => sum + campaign.spend_cents, 0);
  const leads = campaigns.reduce((sum, campaign) => sum + campaign.leads_count, 0);
  const costPerLead = leads > 0 ? Math.round(spend / leads) : null;

  return (
    <>
      {header}
      <ul className="grid grid-cols-2 gap-px border border-border bg-border lg:grid-cols-4">
        {[
          ["Active campaigns", String(active.length)],
          ["Total spend", moneyLabel(spend)],
          ["Leads produced", String(leads)],
          ["Cost per lead", costPerLead == null ? "—" : moneyLabel(costPerLead)],
        ].map(([label, value]) => (
          <li key={label} className="bg-background p-6">
            <p className="text-2xl font-semibold tracking-tight">{value}</p>
            <p className="mt-2 text-[11px] font-medium uppercase tracking-widest text-muted-foreground">{label}</p>
          </li>
        ))}
      </ul>

      <div className="mt-12 space-y-12">
        <FormSection title="Campaigns" description="Open a campaign to update its status, spend and results.">
          {campaigns.length === 0 ? (
            <p className="border-y border-border py-6 text-sm text-muted-foreground">No campaigns yet. Add the first one below.</p>
          ) : (
            <ul className="divide-y divide-border border-y border-border">
              {campaigns.map((campaign) => {
                const client = Array.isArray(campaign.clients) ? campaign.clients[0] : campaign.clients;
                return (
                  <li key={campaign.id}>
                    <details className="group py-5">
                      <summary className="flex cursor-pointer list-none flex-wrap items-center justify-between gap-4">
                        <div>
                          <p className="font-medium">{campaign.name}</p>
                          <p className="mt-1 text-sm text-muted-foreground">
                            <Link href={`/app/clients/${campaign.client_id}`} className="underline decoration-border underline-offset-4">
                              {client?.name ?? "Client"}
                            </Link>{" "}
                            · {channelLabels[campaign.channel] ?? campaign.channel}
                            {campaign.starts_on ? ` · ${dateLabel(campaign.starts_on)}` : ""}
                            {campaign.ends_on ? ` to ${dateLabel(campaign.ends_on)}` : ""}
                          </p>
                        </div>
                        <div className="flex items-center gap-6 text-sm text-muted-foreground">
                          <span>
                            {moneyLabel(campaign.spend_cents)}
                            {campaign.budget_cents != null ? ` of ${moneyLabel(campaign.budget_cents)}` : ""}
                          </span>
                          <span>{campaign.leads_count} leads</span>
                          <span className="rounded-full border border-border px-2.5 py-0.5 text-[11px] font-medium uppercase tracking-widest">
                            {statusLabels[campaign.status] ?? campaign.status}
                          </span>
                        </div>
                      </summary>
                      {campaign.objective ? <p className="mt-4 text-sm leading-6 text-muted-foreground">Goal: {campaign.objective}</p> : null}
                      <div className="mt-6 space-y-6">
                        <CampaignResultsForm
                          id={campaign.id}
                          status={campaign.status}
                          spendCents={campaign.spend_cents}
                          leads={campaign.leads_count}
                          note={campaign.results_note}
                        />
                        <DeleteCampaignForm id={campaign.id} />
                      </div>
                    </details>
                  </li>
                );
              })}
            </ul>
          )}
        </FormSection>

        <FormSection title="Add a campaign">
          <NewCampaignForm
            clients={clients.map((client) => ({ id: client.id, label: `${client.name}${client.company ? ` · ${client.company}` : ""}` }))}
          />
        </FormSection>
      </div>
    </>
  );
}
