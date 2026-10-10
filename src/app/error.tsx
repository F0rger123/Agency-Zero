"use client";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="mx-auto flex min-h-screen w-full max-w-xl flex-col justify-center px-6">
      <p className="text-xs font-medium uppercase tracking-widest text-muted-foreground">
        Error
      </p>
      <h1 className="mt-3 text-2xl font-semibold tracking-tight">
        Something went wrong
      </h1>
      <p className="mt-3 text-sm leading-6 text-muted-foreground">
        An unexpected error occurred
        {error.digest ? (
          <span className="font-mono text-xs text-faint-foreground">
            {" "}
            (ref: {error.digest})
          </span>
        ) : null}
        .
      </p>
      <button
        type="button"
        onClick={reset}
        className="mt-8 inline-flex w-fit items-center rounded-md bg-inverted px-4 py-2 text-sm font-medium text-inverted-foreground transition-colors hover:bg-neutral-700"
      >
        Try again
      </button>
    </div>
  );
}
