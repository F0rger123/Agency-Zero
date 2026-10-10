import Link from "next/link";
import { appPath } from "@/lib/routes";
import { signOut } from "@/app/actions/auth";

/**
 * Shown to a signed-in account the database does not recognise as owner/team,
 * or when the access check itself failed. Includes the exact, copy-pasteable
 * fix so the owner is never stuck.
 */
export function NoAccess({
  email,
  userId,
  problem,
}: {
  email: string;
  userId: string;
  problem?: string;
}) {
  const sql = `update public.app_owner set user_id = '${userId}' where id = 1;`;
  return (
    <main className="mx-auto flex min-h-screen w-full max-w-xl flex-col justify-center px-6 py-16">
      <p className="text-xs font-medium uppercase tracking-widest text-muted-foreground">Agency Zero</p>
      <h1 className="mt-3 text-2xl font-semibold tracking-tight">
        {problem ? "Could not verify access" : "This account is not set up as the owner"}
      </h1>
      <p className="mt-3 text-sm leading-6 text-muted-foreground">
        {problem ? (
          <>The access check failed: <span className="font-mono text-foreground">{problem}</span>. This is a database or connection problem, not a permissions decision. Reload, and if it persists check Supabase.</>
        ) : (
          <>
            You are signed in as <span className="text-foreground">{email || "this account"}</span>, but the database does not
            list it as the Agency Zero owner or an authorised team member.
          </>
        )}
      </p>

      {!problem ? (
        <div className="mt-8 border border-border p-5">
          <p className="text-sm font-medium">If this is your own account (the owner)</p>
          <p className="mt-2 text-sm leading-6 text-muted-foreground">
            Open the Supabase SQL editor for this project and run:
          </p>
          <pre className="mt-3 overflow-x-auto bg-muted p-3 font-mono text-xs leading-5">{sql}</pre>
          <p className="mt-3 text-xs text-faint-foreground">
            Then reload. Anyone else must be added by the owner with{" "}
            <span className="font-mono">insert into public.app_team (user_id) values (…)</span>.
          </p>
        </div>
      ) : null}

      <div className="mt-8 flex items-center gap-6 text-sm">
        <form action={signOut}>
          <button type="submit" className="font-medium underline decoration-border underline-offset-4">
            Sign out
          </button>
        </form>
        <Link href="/" className="text-muted-foreground underline decoration-border underline-offset-4">
          Back to the website
        </Link>
      </div>
    </main>
  );
}

/** Banner shown while migrations 0014+ are not applied to the database yet. */
export function MigrationWarning() {
  return (
    <div role="status" className="mb-8 border border-border bg-muted px-5 py-4 text-sm leading-6">
      <p className="font-medium">Database update pending</p>
      <p className="mt-1 text-muted-foreground">
        This version of Agency Zero expects migrations <span className="font-mono">0014</span>–<span className="font-mono">0019</span>.
        Until they are applied, owner-only protection, Total Revenue and website leads are not active. Apply them in the Supabase SQL
        editor (files in <span className="font-mono">supabase/scripts/apply/</span>), then reload. The{" "}
        <Link href={appPath("/system")} className="underline underline-offset-4">Database status</Link> page shows exactly what is missing.
      </p>
    </div>
  );
}
