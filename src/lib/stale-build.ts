"use client";

import { useEffect } from "react";
import { clearOfflineData } from "@/components/offline";

/**
 * After a new deployment, a tab (or installed app) that is still running the old code can ask the server for things that no
 * longer exist: a server action id, a script chunk. That surfaces as a scary "Something went wrong". Those errors are
 * fixed by loading the new version, so this reloads once, automatically, after clearing the offline copy of the old pages.
 */
export const STALE_BUILD = /Failed to find Server Action|older or newer deployment|ChunkLoadError|Loading chunk .* failed|dynamically imported module|Unexpected token '<'|Importing a module script failed/i;
const FLAG = "az-stale-reload";

export function isStaleBuildError(error: Error): boolean {
  return STALE_BUILD.test(`${error.name} ${error.message}`);
}

/** Hands back a function that clears cached pages and reloads (the "Reload app" button uses it too). */
export function reloadFresh() {
  clearOfflineData();
  window.setTimeout(() => window.location.reload(), 150);
}

export function useRecoverFromStaleBuild(error: Error) {
  useEffect(() => {
    if (!isStaleBuildError(error)) return;
    try {
      // One automatic attempt per tab session, so a genuine bug can never cause a reload loop.
      if (window.sessionStorage.getItem(FLAG)) return;
      window.sessionStorage.setItem(FLAG, "1");
    } catch {
      return;
    }
    reloadFresh();
  }, [error]);
}
