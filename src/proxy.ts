import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import { isCrmPath, safeNextPath } from "@/lib/routes";

/**
 * Next.js 16 proxy (formerly middleware).
 *
 * Refreshes the Supabase auth session and guards the private half of the site:
 *   - `/app/**` (the CRM) requires a signed-in user. Being signed in is only the
 *     first gate — the CRM layout additionally requires `public.is_owner()`
 *     (owner or explicitly authorised team member), and Postgres RLS enforces
 *     the same rule on every row, so a valid-but-unauthorised account sees no
 *     data even if it somehow reaches a route.
 *   - Everything else is the public marketing site, `/login`, `/auth/callback`
 *     and the tokenised customer links (`/q`, `/c`).
 * (DECISIONS D-019, D-043.)
 */
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

  const { pathname, search } = request.nextUrl;

  if (!user && isCrmPath(pathname)) {
    const login = new URL("/login", request.url);
    login.searchParams.set("next", `${pathname}${search}`);
    return NextResponse.redirect(login);
  }

  if (user && pathname === "/login") {
    return NextResponse.redirect(new URL(safeNextPath(request.nextUrl.searchParams.get("next")), request.url));
  }

  return supabaseResponse;
}

export const config = {
  // Only the CRM and the login page need session handling. The public marketing
  // site, customer links and static assets never invoke the proxy, so they stay
  // cacheable and pay no auth cost.
  matcher: ["/app", "/app/:path*", "/login"],
};
