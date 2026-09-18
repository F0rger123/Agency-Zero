/**
 * True when the required Supabase environment variables are present.
 * Used to render honest "setup required" states instead of crashing
 * when the app runs without a configured backend.
 */
export function isSupabaseConfigured(): boolean {
  return Boolean(
    process.env.NEXT_PUBLIC_SUPABASE_URL &&
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  );
}
