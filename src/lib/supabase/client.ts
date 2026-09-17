"use client";

import { createBrowserClient } from "@supabase/ssr";

/**
 * Supabase client for Browser Components (Client Components).
 * Call sites must guard with `isSupabaseConfigured()`.
 */
export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
}
