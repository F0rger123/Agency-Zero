import type { Metadata } from "next";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { passkeysConfigured } from "@/lib/passkeys/server";
import { FormSection } from "@/components/form-controls";
import { PageHeader } from "@/components/page-header";
import { DataFailure, SetupRequired } from "@/components/states";
import { PasskeysManager, type PasskeyRow } from "./passkeys-manager";

export const metadata: Metadata = { title: "Security" };
export const dynamic = "force-dynamic";

/** Settings → Security: passkeys for CRM sign-in. Only the signed-in, authorized user manages their own. */
export default async function SecurityPage() {
  if (!isSupabaseConfigured()) return <SetupRequired />;
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("passkeys")
    .select("id, name, created_at, last_used_at, device_type, backed_up")
    .order("created_at", { ascending: false })
    .limit(50);

  const migrationMissing = Boolean(error && /passkeys|schema cache|does not exist/i.test(error.message));

  return (
    <>
      <Link href="/app/settings" className="text-sm text-muted-foreground underline decoration-border underline-offset-4 hover:text-foreground">
        ← Settings
      </Link>
      <PageHeader
        title="Security"
        description="Sign in with a passkey (your device's fingerprint, face unlock, Windows Hello or PIN) instead of typing a password. Your password keeps working as a fallback."
      />

      {migrationMissing ? (
        <p className="border-y border-border py-6 text-sm text-muted-foreground">
          Passkeys need database update <code className="font-mono text-foreground">0026</code>. Apply it in the Supabase SQL editor, then reload this page.
        </p>
      ) : error ? (
        <DataFailure title="Passkeys" message={error.message} />
      ) : (
        <FormSection title="Passkeys" description="Each device you add can sign in without a password. Only authorized CRM users can add or use one.">
          <PasskeysManager passkeys={(data ?? []) as PasskeyRow[]} configured={passkeysConfigured()} defaultName="This device" />
        </FormSection>
      )}
    </>
  );
}
