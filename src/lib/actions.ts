import { createClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { field, type ActionState } from "@/lib/forms";

/**
 * Shared server-action helpers (ROADMAP P0-4).
 *
 * Every mutating server action must:
 *   1. verify the session with `getUserClient()` (server actions run in their
 *      own request, so they cannot trust the page's earlier check);
 *   2. validate input with the helpers below;
 *   3. confirm the write actually touched a row (`notFoundWhenNoRows`), so a
 *      stale or forged id never reports success.
 * Authorisation beyond "logged in" is enforced by Postgres RLS (`is_owner()`).
 */

export type UserClient = Awaited<ReturnType<typeof createClient>>;

export async function getUserClient(): Promise<{ supabase: UserClient; userId: string } | { error: string }> {
  if (!isSupabaseConfigured()) return { error: "Supabase is not configured." };
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  return user ? { supabase, userId: user.id } : { error: "Your session has expired. Sign in again." };
}

/**
 * Use after an `update(…, { count: "exact" })` / `delete({ count: "exact" })`.
 * Returns an error state when no row matched (unknown id, or hidden by RLS).
 */
export function notFoundWhenNoRows(count: number | null, what = "Record"): ActionState | null {
  return count === 0 || count === null ? { error: `${what} not found, or it was already removed.` } : null;
}

/** Whole number in [0, max]; empty → null; invalid → ActionState error. */
export function wholeNumberField(
  formData: FormData,
  name: string,
  label: string,
  max: number
): number | null | ActionState {
  const raw = field(formData, name);
  if (!raw) return null;
  const value = Number(raw);
  if (!Number.isInteger(value) || value < 0 || value > max) {
    return { error: `${label} must be a whole number from 0 to ${max}.` };
  }
  return value;
}

/** Hours (decimal) → minutes. Empty → null. */
export function hoursToMinutesField(formData: FormData, name: string, label: string): number | null | ActionState {
  const raw = field(formData, name);
  if (!raw) return null;
  const hours = Number(raw);
  if (!Number.isFinite(hours) || hours < 0 || hours > 24000) {
    return { error: `${label} must be zero or a positive number of hours.` };
  }
  return Math.round(hours * 60);
}

/** Money amount (decimal currency units) → integer cents. Empty → null. */
export function moneyToCentsField(formData: FormData, name: string, label: string): number | null | ActionState {
  const raw = field(formData, name);
  if (!raw) return null;
  const amount = Number(raw);
  if (!Number.isFinite(amount) || amount < 0 || amount > 100000000) {
    return { error: `${label} must be a valid positive amount.` };
  }
  return Math.round(amount * 100);
}

export function isActionError(value: unknown): value is ActionState {
  return typeof value === "object" && value !== null && "error" in value;
}
