import type { Metadata } from "next";
import { createClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { todayIso } from "@/lib/format";
import { PageHeader } from "@/components/page-header";
import { SetupRequired } from "@/components/states";

export const metadata: Metadata = { title: "Database status" };

type Probe = { name: string; migration: string; run: (s: Awaited<ReturnType<typeof createClient>>, today: string) => PromiseLike<{ error: { message: string } | null }> };

const table = (name: string, migration: string): Probe => ({
  name: `table ${name}`,
  migration,
  run: (s) => s.from(name).select("*", { count: "exact", head: true }),
});

const rpc = (name: string, migration: string, withToday = true): Probe => ({
  name: `function ${name}()`,
  migration,
  run: (s, today) => s.rpc(name, withToday ? { p_today: today } : {}),
});

/** Read-only probes, one per piece of database the app depends on. */
const probes: Probe[] = [
  table("clients", "0002"),
  table("projects", "0003"),
  table("tasks", "0004"),
  table("quotes", "0006"),
  table("invoices", "0006"),
  table("contracts", "0006"),
  table("services", "0010"),
  rpc("get_dashboard_summary", "0011"),
  table("app_owner", "0014"),
  rpc("is_owner", "0014", false),
  table("payments", "0016"),
  rpc("get_invoice_summary", "0017"),
  table("app_team", "0018"),
  rpc("get_revenue_summary", "0018"),
  table("leads", "0019"),
  {
    name: "work item columns on tasks (kind, severity)",
    migration: "0023",
    run: (s) => s.from("tasks").select("kind, severity, requester_contact_id", { count: "exact", head: true }),
  },
  table("shoot_schedules", "0024"),
  table("shoots", "0024"),
];

/**
 * Database status — one read-only check per dependency, with the database's own
 * error text. Use it when any CRM page says "Something went wrong": the failing
 * row names the migration that is missing or the exact error.
 */
export default async function SystemPage() {
  if (!isSupabaseConfigured()) return <SetupRequired />;
  const supabase = await createClient();
  const today = todayIso();
  const { data: auth } = await supabase.auth.getUser();

  const results = await Promise.all(
    probes.map(async (probe) => {
      try {
        const { error } = await probe.run(supabase, today);
        return { probe, message: error ? error.message : null };
      } catch (err) {
        return { probe, message: err instanceof Error ? err.message : "Unknown error" };
      }
    }),
  );
  const failing = results.filter((r) => r.message);
  const missingMigrations = [...new Set(failing.map((r) => r.probe.migration))].sort();

  return (
    <>
      <PageHeader
        title="Database status"
        description="A read-only check of everything the CRM needs from the database. Nothing here changes any data."
      />

      <dl className="mb-10 grid gap-4 text-sm sm:grid-cols-2">
        <div>
          <dt className="text-xs uppercase tracking-widest text-muted-foreground">Signed in as</dt>
          <dd className="mt-1 break-all">{auth.user?.email ?? "unknown"}</dd>
        </div>
        <div>
          <dt className="text-xs uppercase tracking-widest text-muted-foreground">User id</dt>
          <dd className="mt-1 break-all font-mono text-xs">{auth.user?.id ?? "unknown"}</dd>
        </div>
      </dl>

      <p role="status" className="mb-6 border border-border bg-muted px-5 py-4 text-sm leading-6">
        {failing.length === 0 ? (
          <>Everything the CRM depends on is present.</>
        ) : (
          <>
            {failing.length} of {results.length} checks failed. Migrations involved:{" "}
            <span className="font-mono">{missingMigrations.join(", ")}</span>. Apply them in order in the Supabase SQL editor
            (files in <span className="font-mono">supabase/scripts/apply/</span>), then reload this page.
          </>
        )}
      </p>

      <div className="overflow-x-auto border border-border">
        <table className="w-full text-left text-sm">
          <thead className="border-b border-border text-xs uppercase tracking-widest text-muted-foreground">
            <tr>
              <th className="px-4 py-3 font-medium">Check</th>
              <th className="px-4 py-3 font-medium">Migration</th>
              <th className="px-4 py-3 font-medium">Result</th>
            </tr>
          </thead>
          <tbody>
            {results.map(({ probe, message }) => (
              <tr key={probe.name} className="border-b border-border last:border-0 align-top">
                <td className="px-4 py-3 font-mono text-xs">{probe.name}</td>
                <td className="px-4 py-3 font-mono text-xs">{probe.migration}</td>
                <td className="px-4 py-3">
                  {message ? <span className="break-words text-red-700">{message}</span> : <span className="text-muted-foreground">OK</span>}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
}
