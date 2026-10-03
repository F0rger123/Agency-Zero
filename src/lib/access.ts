import { cache } from "react";
import { createClient } from "@/lib/supabase/server";

/**
 * Can the signed-in user use the CRM?
 *
 *   ok      – `public.is_owner()` says yes (owner, or a member of `public.app_team`).
 *   denied  – the database is up to date and this account is not authorised.
 *   legacy  – `is_owner()` does not exist yet, i.e. migrations 0014+ have not been
 *             applied to this database. At that point the database's own policies are
 *             the old "any signed-in user" ones, so this check cannot add protection;
 *             the CRM stays usable (with a visible warning) instead of locking the
 *             owner out of their own system.
 *   error   – the check itself failed (network/DB); never reported as "no access".
 *
 * Postgres RLS (`is_owner()`) remains the real gate on every row once migrated.
 */
export type AccessState =
  | { status: "ok" }
  | { status: "denied" }
  | { status: "legacy" }
  | { status: "error"; message: string };

export const getAccessState = cache(async (): Promise<AccessState> => {
  const supabase = await createClient();
  const { data, error } = await supabase.rpc("is_owner");
  if (error) {
    if (/could not find the function|does not exist|schema cache/i.test(error.message)) {
      return { status: "legacy" };
    }
    return { status: "error", message: error.message };
  }
  return data === true ? { status: "ok" } : { status: "denied" };
});
