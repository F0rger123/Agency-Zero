import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

/**
 * Next.js 16 proxy (formerly middleware).
 * Refreshes the Supabase auth session on every request and enforces
 * the private-app boundary: everything except /login and /auth/callback
 * requires an authenticated owner (DECISIONS.md D-003).
 */
const PUBLIC_PATHS = ["/login", "/auth/callback", "/q", "/c"];

export async function proxy(request: NextRequest) {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  // Without Supabase configuration nobody can authenticate. Let requests
  // through so pages can render their "setup required" states instead of
  // redirect-looping.
  if (!url || !anonKey) {
    return NextResponse.next();
  }

  let supabaseResponse = NextResponse.next({ request });

  const supabase = createServerClient(url, anonKey, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value }) =>
          request.cookies.set(name, value)
        );
        supabaseResponse = NextResponse.next({ request });
        cookiesToSet.forEach(({ name, value, options }) =>
          supabaseResponse.cookies.set(name, value, options)
        );
      },
    },
  });

  // getClaims() verifies the JWT signature locally against the project's cached
  // signing keys (no Auth-server round trip on every navigation) and still
  // refreshes an expired session. Projects on a legacy symmetric JWT secret
  // transparently fall back to a server check, so this is never less safe than
  // before for rendering. Every server action still calls getUser() (see
  // src/lib/actions.ts), so writes are authorised against live session state.
  const { data: claimsData } = await supabase.auth.getClaims();
  const user = claimsData?.claims?.sub ? { id: claimsData.claims.sub } : null;

  const { pathname } = request.nextUrl;
  const isPublic = PUBLIC_PATHS.some(
    (p) => pathname === p || pathname.startsWith(`${p}/`)
  );

  if (!user && !isPublic) {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  if (user && pathname === "/login") {
    return NextResponse.redirect(new URL("/", request.url));
  }

  return supabaseResponse;
}

export const config = {
  matcher: [
    // Run on everything except Next.js internals and static assets.
    "/((?!_next/static|_next/image|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico)$).*)",
  ],
};
