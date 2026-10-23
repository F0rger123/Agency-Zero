"use client";

import { useEffect } from "react";
import { clearOfflineData } from "@/components/offline";

/**
 * After a new deployment, a tab (or installed app) that is still running the old code can ask the server for things that no
 * longer exist: a server action id, a script chunk. That surfaces as a scary "Something went wrong". Those errors are
 * fixed by loading the new version, so this reloads once, automatically, after clearing the offline copy of the old pages.
 */
// Next 16 words a missing action as `UnrecognizedActionError: Server Action "…" was not found on the server`.
export const STALE_BUILD = /UnrecognizedActionError|Server Action .* was not found|Failed to find Server Action|older or newer deployment|ChunkLoadError|Loading chunk .* failed|dynamically imported module|Unexpected token '<'|Importing a module script failed/i;
const FLAG = "az-stale-reload";

export function isStaleBuildError(error: unknown): boolean {
  if (!error || typeof error !== "object") return false;
  const { name, message } = error as { name?: unknown; message?: unknown };
  return STALE_BUILD.test(`${String(name ?? "")} ${String(message ?? "")}`);
}

/**
 * One automatic reload per 30 seconds per tab: enough to pick up every new deployment in a long session,
 * never a reload loop if the error is a genuine bug.
 */
function mayAutoReload(): boolean {
  try {
    const last = Number(window.sessionStorage.getItem(FLAG) ?? 0);
    if (Date.now() - last < 30_000) return false;
    window.sessionStorage.setItem(FLAG, String(Date.now()));
    return true;
  } catch {
    return false;
  }
}

/**
 * For server actions called directly from code (autosaves): when the call failed because the app was updated,
 * run `beforeReload` (stash unsaved work on the device) and reload into the new version. Returns true if it did.
 */
export function recoverIfStale(error: unknown, beforeReload?: () => void): boolean {
  if (!isStaleBuildError(error)) return false;
  beforeReload?.();
  if (mayAutoReload()) reloadFresh();
  return true;
}

/** Hands back a function that clears cached pages and reloads (the "Reload app" button uses it too). */
export function reloadFresh() {
  clearOfflineData();
  window.setTimeout(() => window.location.reload(), 150);
}

export function useRecoverFromStaleBuild(error: Error) {
  useEffect(() => {
    if (isStaleBuildError(error) && mayAutoReload()) reloadFresh();
  }, [error]);
}
