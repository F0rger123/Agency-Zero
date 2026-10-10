"use client";

import { useEffect, useSyncExternalStore } from "react";

const WARM_KEY = "az-warm-at";
const WARM_EVERY_MS = 6 * 60 * 60 * 1000;

const subscribeOnline = (callback: () => void) => {
  window.addEventListener("online", callback);
  window.addEventListener("offline", callback);
  return () => {
    window.removeEventListener("online", callback);
    window.removeEventListener("offline", callback);
  };
};

export const useOnline = () =>
  useSyncExternalStore(
    subscribeOnline,
    () => navigator.onLine,
    () => true,
  );

/** Asks the service worker to forget everything it saved. Called on sign-out. */
export function clearOfflineData() {
  try {
    navigator.serviceWorker?.controller?.postMessage("clear");
    void caches?.keys().then((keys) => keys.forEach((key) => void caches.delete(key)));
  } catch {
    // Nothing cached, or caches unavailable: nothing to clear.
  }
}

/**
 * Registers the offline service worker (production only) and, now and then, quietly opens the main sections
 * once so they are saved for offline use. Shows a bar while the device has no connection.
 */
export function OfflineSupport({ warm }: { warm: string[] }) {
  const online = useOnline();

  useEffect(() => {
    if (process.env.NODE_ENV !== "production" || !("serviceWorker" in navigator)) return;
    let cancelled = false;
    navigator.serviceWorker
      .register("/sw.js", { scope: "/" })
      .then(() => navigator.serviceWorker.ready)
      .then(async () => {
        let last = 0;
        try {
          last = Number(window.localStorage.getItem(WARM_KEY) ?? 0);
        } catch {
          // Storage blocked: warm every time, it is cheap.
        }
        if (Date.now() - last < WARM_EVERY_MS) return;
        // Let the page settle first, then fetch sections one at a time.
        await new Promise((resolve) => window.setTimeout(resolve, 4000));
        for (const href of warm) {
          if (cancelled || !navigator.onLine) return;
          try {
            await fetch(href, { headers: { Accept: "text/html" }, credentials: "same-origin" });
          } catch {
            return;
          }
        }
        try {
          window.localStorage.setItem(WARM_KEY, String(Date.now()));
        } catch {
          // Ignore.
        }
      })
      .catch(() => {
        // Offline support is an extra; the app works without it.
      });
    return () => {
      cancelled = true;
    };
  }, [warm]);

  if (online) return null;
  return (
    <div role="status" className="fixed inset-x-0 bottom-0 z-[70] flex justify-center px-4 pb-4 max-sm:pb-3">
      <p className="max-w-md rounded-full border-[1.5px] border-foreground bg-background px-5 py-2.5 text-center text-sm shadow-lg">
        <span className="font-semibold">Offline.</span> Showing what is saved on this device. Lock In and Quick note drafts still work; other changes need a connection.
      </p>
    </div>
  );
}
