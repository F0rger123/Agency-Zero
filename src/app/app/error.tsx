"use client";

export default function AppError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="border-t border-border pt-10">
      <p className="text-xs font-medium uppercase tracking-widest text-muted-foreground">
        Error
      </p>
      <h1 className="mt-3 text-xl font-semibold tracking-tight">
        Something went wrong
      </h1>
      <p className="mt-2 max-w-prose text-sm leading-6 text-muted-foreground">
        This page failed to load
        {error.digest ? (
          <span className="font-mono text-xs text-faint-foreground">
            {" "}
            (ref: {error.digest})
          </span>
        ) : null}
        . Retry below — if it keeps failing, check that Supabase is reachable and
        migrations are applied.
      </p>
      <button
        type="button"
        onClick={reset}
        className="mt-6 rounded-md bg-inverted px-4 py-2 text-sm font-medium text-inverted-foreground transition-colors hover:bg-neutral-700"
      >
        Try again
      </button>
    </div>
  );
}
