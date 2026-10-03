import { cache } from "react";
import { createClient } from "@/lib/supabase/server";

/**
 * Is the signed-in user allowed to use the CRM?
 *
 * Asks Postgres (`public.is_owner()`: the owner, or a user the owner added to
 * `public.app_team`). This is the same predicate every RLS policy uses, so the
 * UI gate and the data gate can never disagree. Cached per request.
 *
 * A signed-in but unauthorised account is shown a "no access" page and can
 * read nothing — RLS returns zero rows regardless of what the UI does.
 */
export const hasCrmAccess = cache(async (): Promise<boolean> => {
  const supabase = await createClient();
  const { data, error } = await supabase.rpc("is_owner");
  if (error) return false;
  return data === true;
});
