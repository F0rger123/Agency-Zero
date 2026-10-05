"use client";

import { browserSupportsWebAuthn, startAuthentication, startRegistration, WebAuthnError } from "@simplewebauthn/browser";

/** Does this browser support passkeys at all? (Never claims "fingerprint": the device decides how it unlocks.) */
export function passkeysSupported(): boolean {
  return typeof window !== "undefined" && window.isSecureContext && browserSupportsWebAuthn();
}

type ApiResult<T> = { ok: true; data: T } | { ok: false; error: string; code?: string };

async function post<T>(url: string, body?: unknown): Promise<ApiResult<T>> {
  try {
    const response = await fetch(url, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: body === undefined ? undefined : JSON.stringify(body),
      credentials: "same-origin",
    });
    const json = (await response.json().catch(() => ({}))) as T & { error?: string };
    if (!response.ok) return { ok: false, error: friendly(json.error), code: json.error };
    return { ok: true, data: json };
  } catch {
    return { ok: false, error: "Could not reach the server. Check your connection and try again." };
  }
}

function friendly(code?: string): string {
  if (code === "not_configured") return "Passkeys aren't switched on for this site yet. Use your password.";
  if (code === "needs_migration") return "Passkeys need a database update before they can be used. Use your password for now.";
  if (code === "busy") return "Passkey sign-in is busy. Try again in a minute, or use your password.";
  return code || "Something went wrong. Try again.";
}

/** User closed or dismissed the system prompt (not an error worth shouting about). */
function cancelled(error: unknown): boolean {
  return error instanceof WebAuthnError ? error.name === "NotAllowedError" || error.name === "AbortError" : (error as { name?: string })?.name === "NotAllowedError";
}

export type PasskeyOutcome = { ok: true } | { ok: false; error: string; cancelled?: boolean };

/** Passkey sign-in: fetch a challenge, open the device prompt immediately, then verify on the server. */
export async function signInWithPasskey(): Promise<PasskeyOutcome> {
  const options = await post<Parameters<typeof startAuthentication>[0]["optionsJSON"]>("/api/passkey/login/options");
  if (!options.ok) return { ok: false, error: options.error };
  let assertion;
  try {
    assertion = await startAuthentication({ optionsJSON: options.data });
  } catch (error) {
    return cancelled(error) ? { ok: false, error: "Passkey sign-in was cancelled.", cancelled: true } : { ok: false, error: "Your device couldn't complete the passkey sign-in. Use your password." };
  }
  const verified = await post<{ ok: true }>("/api/passkey/login/verify", { response: assertion });
  return verified.ok ? { ok: true } : { ok: false, error: verified.error };
}

/** Add a passkey for the signed-in user (device prompt happens here). */
export async function registerPasskey(name: string): Promise<PasskeyOutcome> {
  const options = await post<Parameters<typeof startRegistration>[0]["optionsJSON"]>("/api/passkey/register/options");
  if (!options.ok) return { ok: false, error: options.error };
  let attestation;
  try {
    attestation = await startRegistration({ optionsJSON: options.data });
  } catch (error) {
    if (error instanceof WebAuthnError && error.name === "InvalidStateError") return { ok: false, error: "This device already has a passkey for Agency Zero." };
    return cancelled(error) ? { ok: false, error: "Adding the passkey was cancelled.", cancelled: true } : { ok: false, error: "Your device couldn't create a passkey. Try another device or keep using your password." };
  }
  const saved = await post<{ ok: true }>("/api/passkey/register/verify", { response: attestation, name });
  return saved.ok ? { ok: true } : { ok: false, error: saved.error };
}
