"use client";

import Link from "next/link";
import { appPath } from "@/lib/routes";
import { isStaleBuildError, reloadFresh, useRecoverFromStaleBuild } from "@/lib/stale-build";

export default function AppError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useRecoverFromStaleBuild(error);
  if (isStaleBuildError(error)) {
    return (
      <div className="border-t border-border pt-10">
        <h1 className="text-xl font-semibold tracking-tight">The app was just updated</h1>
        <p className="mt-2 max-w-prose text-sm leading-6 text-muted-foreground">
          This screen was opened before the update, so it is loading the new version. Then try again; nothing is wrong with your data.
        </p>
        <button type="button" onClick={reloadFresh} className="mt-6 rounded-md bg-inverted px-4 py-2 text-sm font-medium text-inverted-foreground transition-colors hover:bg-neutral-700">
          Load the new version
        </button>
      </div>
    );
  }
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
        . Retry below. If it keeps failing, open the{" "}
        <Link href={appPath("/system")} className="underline underline-offset-4">
          Database status
        </Link>{" "}
        page: it names the exact migration or error that is the cause.
      </p>
      <button
        type="button"
        onClick={reset}
        className="mt-6 rounded-md bg-inverted px-4 py-2 text-sm font-medium text-inverted-foreground transition-colors hover:bg-neutral-700"
      >
        Try again
      </button>
      <button
        type="button"
        onClick={reloadFresh}
        className="ml-3 mt-6 rounded-md border border-border px-4 py-2 text-sm transition-colors hover:bg-muted"
      >
        Reload the app
      </button>
      <details className="mt-8 max-w-prose text-xs text-muted-foreground">
        <summary className="cursor-pointer">Technical details</summary>
        <p className="mt-2 break-words font-mono">
          {error.name}: {error.message}
          {error.digest ? ` (ref: ${error.digest})` : ""}
        </p>
        <p className="mt-2">If this keeps happening, send this text to whoever is helping you.</p>
      </details>
    </div>
  );
}
