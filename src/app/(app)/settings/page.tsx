import type { Metadata } from "next";
import { createClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { PageHeader } from "@/components/page-header";
import { FormSection } from "@/components/form-controls";
import { MigrationsRequired, SetupRequired } from "@/components/states";
import { isMissingTable } from "@/lib/forms";
import { ProfileForm, WorkspaceForm } from "./settings-forms";

export const metadata: Metadata = { title: "Settings" };

// Live database reads — always render per request, never prerender.
export const dynamic = "force-dynamic";

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

  const profile = await supabase
    .from("profiles")
    .select("full_name, timezone, currency, default_daily_capacity_minutes")
    .maybeSingle();
  const settings = await supabase
    .from("settings")
    .select("business_name, address, tax_id, default_currency, default_tax_rate, quote_prefix, invoice_prefix")
    .eq("id", 1)
    .maybeSingle();

  const schemaMissing =
    (profile.error && isMissingTable(profile.error.message)) ||
    (settings.error && isMissingTable(settings.error.message));

  if (schemaMissing) {
    return (
      <>
        <PageHeader
          title="Settings"
          description="Owner account and workspace defaults used across quotes, contracts, invoices, and workload planning."
        />
        <MigrationsRequired />
      </>
    );
  }

  const profileError = profile.error && !isMissingTable(profile.error.message);
  const settingsError = settings.error && !isMissingTable(settings.error.message);
  if (profileError) throw new Error(profile.error!.message);
  if (settingsError) throw new Error(settings.error!.message);

  return (
    <>
      <PageHeader
        title="Settings"
        description="Owner account and workspace defaults. Changes persist to the database and apply to new documents."
      />

      <section className="mt-2">
        <h2 className="text-xs font-medium uppercase tracking-widest text-muted-foreground">
          Account
        </h2>
        <dl className="mt-2 divide-y divide-border border-t border-border">
          <Row label="Email" value={user?.email ?? ""} />
          <Row label="User ID" value={user?.id ?? ""} />
        </dl>
        <p className="mt-2 text-xs text-muted-foreground">
          Sign-in security (password reset, email confirmation) is managed in your
          Supabase project — see supabase/README.md.
        </p>
      </section>

      <div className="mt-12">
        <FormSection
          title="Owner profile"
          description="Your name, timezone, currency, and default daily work capacity. Capacity feeds the workload planner."
        >
          {profile.data ? (
            <ProfileForm
              profile={{
                full_name: profile.data.full_name,
                timezone: profile.data.timezone,
                currency: profile.data.currency,
                default_daily_capacity_minutes: profile.data.default_daily_capacity_minutes,
              }}
            />
          ) : (
            <p className="text-sm text-muted-foreground">
              No profile row exists yet. Sign out and back in, or re-create the owner
              user so the sign-up trigger creates it.
            </p>
          )}
        </FormSection>
      </div>

      <div className="mt-12">
        <FormSection
          title="Workspace"
          description="Name, address, tax defaults, and document prefixes used on quotes, contracts, and invoices."
        >
          {settings.data ? (
            <WorkspaceForm
              settings={{
                business_name: settings.data.business_name,
                address: settings.data.address,
                tax_id: settings.data.tax_id,
                default_currency: settings.data.default_currency,
                default_tax_rate: settings.data.default_tax_rate,
                quote_prefix: settings.data.quote_prefix,
                invoice_prefix: settings.data.invoice_prefix,
              }}
            />
          ) : (
            <p className="text-sm text-muted-foreground">
              No settings row exists yet. The database trigger creates it with the
              first owner account.
            </p>
          )}
        </FormSection>
      </div>
    </>
  );
}
