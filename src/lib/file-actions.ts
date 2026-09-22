"use server";

import { createClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/supabase/config";

/**
 * Signed download links for private files (D-021).
 *
 * Files live in the private `client-files` Storage bucket (client uploads use
 * `<client_id>/…`, project uploads use `projects/<project_id>/…`). Links are
 * created on demand for the tab that is actually open, so a workspace never
 * pays for signed URLs it is not showing. Links expire after one hour.
 */
export async function createSignedFileLinksAction(
  paths: string[]
): Promise<{ links: Record<string, string>; error?: string }> {
  if (!isSupabaseConfigured()) return { links: {}, error: "Supabase is not configured." };
  if (paths.length === 0) return { links: {} };
  if (paths.length > 50) return { links: {}, error: "Too many files to link at once." };

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { links: {}, error: "Your session has expired. Sign in again." };

  const links: Record<string, string> = {};
  const results = await Promise.all(
    paths.map(async (path) => {
      const signed = await supabase.storage.from("client-files").createSignedUrl(path, 3600);
      return { path, url: signed.data?.signedUrl ?? null, error: signed.error?.message ?? null };
    })
  );

  for (const result of results) {
    if (result.url) links[result.path] = result.url;
  }

  const failure = results.find((result) => result.error);
  return failure?.error ? { links, error: failure.error } : { links };
}
