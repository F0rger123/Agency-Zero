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

/**
 * Honest data-error state for a section that failed to load.
 *
 * Nothing is swallowed: the page renders the real database message instead of
 * a generic "something went wrong" screen, so a missing migration, a broken
 * RPC, or an RLS problem is diagnosable from the UI. The surrounding shell,
 * navigation, and page header stay mounted.
 */
export function DataFailure({
  title,
  message,
  hint,
}: {
  title: string;
  message: string;
  hint?: string;
}) {
  return (
    <div role="alert" className="border-t border-border pt-8">
      <p className="text-xs font-medium uppercase tracking-widest text-muted-foreground">
        Data error
      </p>
      <h2 className="mt-3 text-base font-medium tracking-tight">
        {title} could not load
      </h2>
      <p className="mt-2 max-w-prose text-sm leading-6 text-muted-foreground">
        {hint ??
          "The database returned an error. The exact message is shown below — nothing is hidden."}
      </p>
      <pre className="mt-4 overflow-x-auto rounded-md border border-border bg-muted/60 p-4 font-mono text-xs leading-5">
        {message}
      </pre>
    </div>
  );
}

/**
 * Small inline pending state used inside `<Suspense>` boundaries. It replaces
 * only the section that is still streaming — never the shell or the whole page.
 */
export function InlinePending({ label = "Loading…" }: { label?: string }) {
  return (
    <div
      aria-busy="true"
      aria-live="polite"
      className="flex items-center gap-3 border-t border-border py-6 text-sm text-muted-foreground"
    >
      <span aria-hidden className="inline-block size-1.5 animate-pulse rounded-full bg-faint-foreground" />
      {label}
    </div>
  );
}

/** Grayscale loading skeleton — communicates shape without color. */
export function Skeleton({ className }: { className?: string }) {
  return <div aria-hidden className={`rounded bg-muted ${className ?? ""}`} />;
}

/** Shown when a list hit its row bound so the owner knows it is truncated. */
export function LimitNotice({ shown, limit, hint }: { shown: number; limit: number; hint: string }) {
  if (shown < limit) return null;
  return (
    <p className="mt-4 border-y border-border py-3 text-xs text-muted-foreground">
      Showing the first {limit} records. {hint}
    </p>
  );
}
