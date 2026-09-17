import { createServerClient } from "@supabase/ssr";
import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { isSupabaseConfigured } from "@/lib/supabase/config";

/**
 * Auth callback for email links (confirmation, recovery).
 * Exchanges the one-time code for a session and redirects into the app.
 */
export async function GET(request: Request) {
  const requestUrl = new URL(request.url);
  const { searchParams, origin } = requestUrl;
  const code = searchParams.get("code");

  // Prefer the configured production origin so an email link cannot redirect
  // the session to an unexpected host behind a proxy. Fall back to the request
  // origin for local development and honest unconfigured states.
  let redirectOrigin = origin;
  const configuredSiteUrl = process.env.NEXT_PUBLIC_SITE_URL?.trim();
  if (configuredSiteUrl) {
    try {
      redirectOrigin = new URL(configuredSiteUrl).origin;
    } catch {
      // Keep the request origin if a local environment has a malformed value.
    }
  }

  if (code && isSupabaseConfigured()) {
    const cookieStore = await cookies();
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() {
            return cookieStore.getAll();
          },
          setAll(cookiesToSet) {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            );
          },
        },
      }
    );

    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) {
      return NextResponse.redirect(new URL("/", redirectOrigin));
    }
  }

  return NextResponse.redirect(new URL("/login", redirectOrigin));
}
