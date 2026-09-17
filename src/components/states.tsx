/**
 * Honest full-page states for infrastructure problems:
 * missing configuration, unapplied migrations. No pretending.
 */

export function SetupRequired() {
  return (
    <div className="mx-auto flex min-h-screen w-full max-w-xl flex-col justify-center px-6">
      <p className="text-xs font-medium uppercase tracking-widest text-muted-foreground">
        Agency Zero
      </p>
      <h1 className="mt-3 text-2xl font-semibold tracking-tight">
        Supabase is not configured
      </h1>
      <div className="mt-3 text-sm leading-6 text-muted-foreground">
        <p>
          Set <code className="font-mono text-foreground">NEXT_PUBLIC_SUPABASE_URL</code>{" "}
          and{" "}
          <code className="font-mono text-foreground">NEXT_PUBLIC_SUPABASE_ANON_KEY</code>{" "}
          in a <code className="font-mono text-foreground">.env.local</code> file, then
          restart the app.
        </p>
        <p className="mt-2">
          See <code className="font-mono text-foreground">.env.example</code> and{" "}
          <code className="font-mono text-foreground">supabase/README.md</code> for the
          full setup, including how to apply the database migrations.
        </p>
      </div>
    </div>
  );
}

export function MigrationsRequired({ detail }: { detail?: string }) {
  return (
    <div className="border-t border-border pt-10">
      <p className="text-xs font-medium uppercase tracking-widest text-muted-foreground">
        Database
      </p>
      <h2 className="mt-3 text-base font-medium tracking-tight">
        Migrations are not applied yet
      </h2>
      <div className="mt-2 max-w-prose text-sm leading-6 text-muted-foreground">
        <p>
          The tables this page needs do not exist. Apply the SQL files in{" "}
          <code className="font-mono text-foreground">supabase/migrations/</code> to
          your Supabase project in numeric order — instructions are in{" "}
          <code className="font-mono text-foreground">supabase/README.md</code>.
        </p>
        {detail ? (
          <p className="mt-2 font-mono text-xs text-faint-foreground">{detail}</p>
        ) : null}
      </div>
    </div>
  );
}

/** Grayscale loading skeleton — communicates shape without color. */
export function Skeleton({ className }: { className?: string }) {
  return <div aria-hidden className={`rounded bg-muted ${className ?? ""}`} />;
}
