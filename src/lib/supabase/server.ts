import { cache } from "react";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

/**
 * Supabase client for Server Components, Server Actions, and Route Handlers.
 * Reads/writes the auth session through Next.js cookies.
 * Call sites must guard with `isSupabaseConfigured()`.
 *
 * Wrapped in React `cache()` so a single request (layout + page + nested
 * server components) shares one client instead of rebuilding it — and one
 * cookie read — for every call.
 */
export const createClient = cache(async () => {
  const cookieStore = await cookies();

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            );
          } catch {
            // Called from a Server Component: safe to skip when
            // src/proxy.ts is refreshing sessions.
          }
        },
      },
    }
  );
});
