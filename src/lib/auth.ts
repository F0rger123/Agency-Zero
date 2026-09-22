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
 * Before this helper, the authenticated layout, the dashboard, and every other
 * page each called `supabase.auth.getUser()` — a network round trip to the
 * Supabase Auth server on every navigation. React `cache()` deduplicates the
 * call for the lifetime of one server request, so the layout and the page it
 * wraps share a single verification.
 *
 * `getUser()` (not `getSession()`) is kept: the JWT is revalidated against the
 * Auth server rather than trusted from the cookie. Server actions create their
 * own request, so they still verify ownership independently.
 */
export const getSession = cache(async (): Promise<SessionState> => {
  if (!isSupabaseConfigured()) {
    return { configured: false, user: null, error: null };
  }

  const supabase = await createClient();
  const { data, error } = await supabase.auth.getUser();

  if (error) {
    return { configured: true, user: null, error: error.message };
  }

  return {
    configured: true,
    user: data.user ? { id: data.user.id, email: data.user.email ?? "" } : null,
    error: null,
  };
});
