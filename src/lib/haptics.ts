"use client";

/**
 * Light haptic feedback on phones.
 *  - Android (and other browsers with the Vibration API): short vibrations.
 *  - iPhone (Safari 18+): there is no vibration API, but toggling a native switch control gives the system "tick". We keep one
 *    hidden switch and flip it. This only works inside a tap, which is where we call it.
 * Off on desktops (no touch), and the owner can turn it off (stored on the device).
 */
export type HapticKind = "light" | "medium" | "success" | "warning";

const KEY = "az-haptics";
const PATTERNS: Record<HapticKind, number | number[]> = { light: 8, medium: 14, success: [10, 50, 16], warning: [24, 40, 24] };
let iosSwitch: HTMLLabelElement | null = null;

export function hapticsEnabled(): boolean {
  if (typeof window === "undefined") return false;
  try {
    return window.localStorage.getItem(KEY) !== "off";
  } catch {
    return true;
  }
}

export function setHapticsEnabled(on: boolean) {
  try {
    window.localStorage.setItem(KEY, on ? "on" : "off");
  } catch {
    // Storage blocked: the choice lasts for this page only.
  }
}

const isTouch = () => typeof window !== "undefined" && window.matchMedia("(pointer: coarse)").matches;

function iosTick() {
  if (!iosSwitch) {
    const label = document.createElement("label");
    label.setAttribute("aria-hidden", "true");
    label.style.cssText = "position:fixed;left:-9999px;top:0;width:1px;height:1px;overflow:hidden;opacity:0;pointer-events:none;";
    const input = document.createElement("input");
    input.type = "checkbox";
    input.setAttribute("switch", "");
    input.tabIndex = -1;
    label.appendChild(input);
    document.body.appendChild(label);
    iosSwitch = label;
  }
  iosSwitch.click();
}

export function haptic(kind: HapticKind = "light") {
  if (!isTouch() || !hapticsEnabled()) return;
  const pattern = PATTERNS[kind];
  if (typeof navigator.vibrate === "function") {
    try {
      navigator.vibrate(pattern);
      return;
    } catch {
      // Fall through to the iPhone way.
    }
  }
  iosTick();
}
