import { cache } from "react";
import { createClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/supabase/config";

export type SessionUser = { id: string; email: string };

export type SessionState = {
  configured: boolean;
  user: SessionUser | null;
  /** Real auth error message when Supabase Auth could not be reached. */
  error: string | null;
};

/**
 * Request-level session lookup (navigation speed, D-034).
 *
 * React `cache()` deduplicates the call for one server request, so the layout
 * and the page it wraps share a single verification.
 *
 * `getClaims()` verifies the JWT signature locally (cached signing keys), so a
 * navigation costs no Auth-server round trip when the project uses asymmetric
 * JWT signing keys (legacy symmetric projects fall back to a server check).
 * The trade-off: a session revoked on the server stays valid for rendering
 * until its access token expires (≤ 1 h by default). Writes are unaffected —
 * server actions call `getUser()` (src/lib/actions.ts) and Postgres RLS
 * (`is_owner()`) still gates every row.
 */
export const getSession = cache(async (): Promise<SessionState> => {
  if (!isSupabaseConfigured()) {
    return { configured: false, user: null, error: null };
  }

  const supabase = await createClient();
  const { data, error } = await supabase.auth.getClaims();

  if (error) {
    return { configured: true, user: null, error: error.message };
  }

  const claims = data?.claims;
  return {
    configured: true,
    user: claims?.sub ? { id: claims.sub, email: typeof claims.email === "string" ? claims.email : "" } : null,
    error: null,
  };
});
