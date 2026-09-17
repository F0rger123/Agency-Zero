import type { Metadata } from "next";
import { createClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { PageHeader } from "@/components/page-header";
import { EmptyState } from "@/components/empty-state";
import { MigrationsRequired, SetupRequired } from "@/components/states";

export const metadata: Metadata = { title: "Settings" };

// Live database reads — always render per request, never prerender.
export const dynamic = "force-dynamic";

function isMissingTable(message: string): boolean {
  return message.includes("does not exist") || message.includes("schema cache");
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-baseline justify-between gap-6 py-3">
      <dt className="text-sm text-muted-foreground">{label}</dt>
      <dd className="truncate text-sm font-medium">{value || "—"}</dd>
    </div>
  );
}

export default async function SettingsPage() {
  if (!isSupabaseConfigured()) {
    return <SetupRequired />;
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // Read-only views of the profile and workspace rows created by the
  // migrations. Editing arrives with Phase 2 — no fake forms here.
  const profile = await supabase
    .from("profiles")
    .select("full_name, timezone, currency, default_daily_capacity_minutes")
    .maybeSingle();
  const settings = await supabase
    .from("settings")
    .select("business_name, default_currency, default_tax_rate, quote_prefix, invoice_prefix")
    .eq("id", 1)
    .maybeSingle();

  const schemaMissing =
    (profile.error && isMissingTable(profile.error.message)) ||
    (settings.error && isMissingTable(settings.error.message));

  const capacity = profile.data?.default_daily_capacity_minutes;
  const capacityHours =
    typeof capacity === "number" ? `${Math.round((capacity / 60) * 10) / 10} h / day` : "";

  return (
    <>
      <PageHeader
        title="Settings"
        description="Owner account and workspace defaults. Values are created by the database migrations; editing is Phase 2+ work."
      />

      {schemaMissing ? (
        <MigrationsRequired />
      ) : (
        <>
          <section className="mt-2">
            <h2 className="text-xs font-medium uppercase tracking-widest text-muted-foreground">
              Account
            </h2>
            <dl className="mt-2 divide-y divide-border border-t border-border">
              <Row label="Email" value={user?.email ?? ""} />
              <Row label="User ID" value={user?.id ?? ""} />
            </dl>
          </section>

          <section className="mt-12">
            <h2 className="text-xs font-medium uppercase tracking-widest text-muted-foreground">
              Owner profile
            </h2>
            <dl className="mt-2 divide-y divide-border border-t border-border">
              <Row label="Name" value={profile.data?.full_name ?? ""} />
              <Row label="Timezone" value={profile.data?.timezone ?? ""} />
              <Row label="Currency" value={profile.data?.currency ?? ""} />
              <Row label="Default capacity" value={capacityHours} />
            </dl>
          </section>

          <section className="mt-12">
            <h2 className="text-xs font-medium uppercase tracking-widest text-muted-foreground">
              Workspace
            </h2>
            <dl className="mt-2 divide-y divide-border border-t border-border">
              <Row label="Business name" value={settings.data?.business_name ?? ""} />
              <Row label="Default currency" value={settings.data?.default_currency ?? ""} />
              <Row
                label="Default tax rate"
                value={
                  settings.data?.default_tax_rate != null
                    ? `${settings.data.default_tax_rate}%`
                    : ""
                }
              />
              <Row label="Quote prefix" value={settings.data?.quote_prefix ?? ""} />
              <Row label="Invoice prefix" value={settings.data?.invoice_prefix ?? ""} />
            </dl>
          </section>

          <div className="mt-14">
            <EmptyState tag="Phase 2+" title="Editing settings arrives with later phases">
              <p>
                Profile, workspace values, and workload defaults become editable
                alongside client management in Phase 2. Sign-in security settings
                (email confirmation, password reset) are managed in your Supabase
                project — see supabase/README.md.
              </p>
            </EmptyState>
          </div>
        </>
      )}
    </>
  );
}
