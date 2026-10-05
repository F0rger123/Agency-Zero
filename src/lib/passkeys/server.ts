import "server-only";

import { createClient as createAdminClient, type SupabaseClient } from "@supabase/supabase-js";

/**
 * Server-side helpers for WebAuthn / passkeys (migration 0026).
 *
 * Only public credential data is stored. Challenges are random, single-use and expire after five minutes. The
 * service-role key is used for exactly three things: challenge bookkeeping, writing a verified credential, and
 * reading app_owner / app_team plus minting a session AFTER a passkey signature has been verified.
 */
export const RP_NAME = "Agency Zero";
export const CHALLENGE_COOKIE = "az_passkey";
export const CHALLENGE_TTL_MS = 5 * 60 * 1000;
const MAX_LIVE_CHALLENGES = 300;

export type Admin = SupabaseClient;

/** The service-role client, or null when SUPABASE_SERVICE_ROLE_KEY is not configured (passkeys are then off). */
export function serviceClient(): Admin | null {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) return null;
  return createAdminClient(url, key, { auth: { persistSession: false, autoRefreshToken: false } });
}

export const passkeysConfigured = (): boolean => Boolean(process.env.SUPABASE_SERVICE_ROLE_KEY && process.env.NEXT_PUBLIC_SUPABASE_URL);

/**
 * The relying party the browser must be on: the production domain (NEXT_PUBLIC_SITE_URL, defaulting to
 * theagencyzero.com). localhost is accepted so passkeys can be tried in development. WebAuthn itself then checks the
 * browser's real origin against this, so a look-alike page cannot use a passkey.
 */
export function relyingParty(request: Request): { rpID: string; origin: string } {
  const host = request.headers.get("host") ?? "";
  if (/^(localhost|127\.0\.0\.1)(:\d+)?$/.test(host)) {
    const proto = request.headers.get("x-forwarded-proto") ?? "http";
    return { rpID: host.split(":")[0], origin: `${proto}://${host}` };
  }
  const site = new URL((process.env.NEXT_PUBLIC_SITE_URL || "https://theagencyzero.com").replace(/\/$/, ""));
  return { rpID: site.hostname, origin: site.origin };
}

/** Rejects cross-site requests: a browser always sends Origin on POST, and it must be this site (or localhost in development). */
export function sameOrigin(request: Request): boolean {
  const origin = request.headers.get("origin");
  if (!origin) return false;
  return origin === relyingParty(request).origin;
}

export async function saveChallenge(
  admin: Admin,
  input: { challenge: string; purpose: "register" | "login"; userId?: string },
): Promise<{ id: string } | { error: string }> {
  const cutoff = new Date(Date.now() - CHALLENGE_TTL_MS).toISOString();
  await admin.from("passkey_challenges").delete().lt("created_at", cutoff);
  const live = await admin.from("passkey_challenges").select("id", { count: "exact", head: true });
  if (live.error) return { error: live.error.message };
  if ((live.count ?? 0) >= MAX_LIVE_CHALLENGES) return { error: "busy" };
  const { data, error } = await admin
    .from("passkey_challenges")
    .insert({ challenge: input.challenge, purpose: input.purpose, user_id: input.userId ?? null })
    .select("id")
    .single();
  if (error || !data) return { error: error?.message ?? "Could not start passkey sign-in." };
  return { id: data.id as string };
}

/** Reads and deletes the challenge in one statement, so it can only ever be used once. */
export async function consumeChallenge(
  admin: Admin,
  id: string | undefined,
  purpose: "register" | "login",
): Promise<{ challenge: string; userId: string | null } | null> {
  if (!id || !/^[0-9a-f-]{36}$/i.test(id)) return null;
  const { data } = await admin.from("passkey_challenges").delete().eq("id", id).eq("purpose", purpose).select("challenge, user_id, created_at");
  const row = data?.[0] as { challenge: string; user_id: string | null; created_at: string } | undefined;
  if (!row) return null;
  if (Date.now() - new Date(row.created_at).getTime() > CHALLENGE_TTL_MS) return null;
  return { challenge: row.challenge, userId: row.user_id };
}

/** Mirrors public.is_owner(): the account must be the owner or an explicitly authorised team member. */
export async function isAuthorizedUser(admin: Admin, userId: string): Promise<boolean> {
  const [owner, team] = await Promise.all([
    admin.from("app_owner").select("user_id", { head: true, count: "exact" }).eq("user_id", userId),
    admin.from("app_team").select("user_id", { head: true, count: "exact" }).eq("user_id", userId),
  ]);
  return (owner.count ?? 0) > 0 || (team.count ?? 0) > 0;
}

export function challengeCookie(id: string, secure: boolean) {
  return { name: CHALLENGE_COOKIE, value: id, httpOnly: true, secure, sameSite: "strict" as const, path: "/api/passkey", maxAge: CHALLENGE_TTL_MS / 1000 };
}

/** Friendly device name from the User-Agent when the owner does not type one. */
export function guessDeviceName(userAgent: string | null): string {
  const ua = userAgent ?? "";
  if (/iPhone/i.test(ua)) return "iPhone";
  if (/iPad/i.test(ua)) return "iPad";
  if (/Android/i.test(ua)) return "Android phone";
  if (/Windows/i.test(ua)) return "Windows PC";
  if (/Macintosh|Mac OS/i.test(ua)) return "Mac";
  if (/Linux|CrOS/i.test(ua)) return "Linux or Chromebook";
  return "This device";
}
