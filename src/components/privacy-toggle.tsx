"use client";

import { useSyncExternalStore } from "react";
import { Icon } from "@/components/icons";
import { haptic } from "@/lib/haptics";

/**
 * "Hide money": blurs MRR, revenue and every amount (anything marked `az-money` / `az-private`),
 * for when a customer is looking at the screen with you. Remembered on this device; AppSplash's
 * inline script applies it before first paint so nothing flashes.
 */
const KEY = "az-private";
const listeners = new Set<() => void>();

function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

const snapshot = () => document.documentElement.dataset.private === "1";

function setPrivate(on: boolean) {
  if (on) document.documentElement.dataset.private = "1";
  else delete document.documentElement.dataset.private;
  try {
    window.localStorage.setItem(KEY, on ? "1" : "0");
  } catch {
    // Storage blocked: still hidden for this visit.
  }
  listeners.forEach((listener) => listener());
}

export function PrivacyToggle() {
  const hidden = useSyncExternalStore(subscribe, snapshot, () => false);
  return (
    <button
      type="button"
      onClick={() => {
        haptic("light");
        setPrivate(!hidden);
      }}
      aria-pressed={hidden}
      aria-label={hidden ? "Show money" : "Hide money"}
      title={hidden ? "Show money" : "Hide money (MRR, revenue, prices)"}
      data-no-haptic
      className={`press inline-flex size-9 shrink-0 items-center justify-center rounded-full border transition-colors ${
        hidden ? "border-foreground bg-foreground text-background" : "border-border hover:border-foreground hover:bg-muted"
      }`}
    >
      <Icon name={hidden ? "eye-off" : "eye"} className="size-[18px]" />
    </button>
  );
}
