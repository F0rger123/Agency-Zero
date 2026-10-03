import type { Metadata } from "next";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import { getAccessState } from "@/lib/access";
import { MigrationWarning, NoAccess } from "@/components/no-access";
import { AppShell } from "@/components/app-shell";
import { SetupRequired } from "@/components/states";

export const metadata: Metadata = { robots: { index: false, follow: false } };

/**
 * Authenticated shell. The proxy already bounces anonymous visitors; this
 * layout double-checks the session server-side.
 *
 * The session lookup is request-cached (`getSession()` → React `cache()`), so
 * the layout and the page it wraps share ONE `auth.getUser()` round trip
 * instead of one each. The AppShell is a client component rendered by this
 * layout, so it stays mounted across navigations — the sidebar never remounts
 * and never flashes white.
 */
export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  /**
   * Dynamic-rendering marker (D-034).
   *
   * Every authenticated route depends on the session cookie and live database
   * reads, so none of them may be baked into the static output. Reading the
   * cookie store here — before any early `SetupRequired` return — keeps the
   * whole `(app)` tree server-rendered on demand, even when the build runs
   * without Supabase environment variables (as Cloudflare builds do, since the
   * secrets are runtime bindings). The performance model is the client router
   * cache with `experimental.staleTimes` plus prefetching, not static HTML.
   */
  await cookies();

  const session = await getSession();

  if (!session.configured) {
    return <SetupRequired />;
  }

  if (!session.user) {
    redirect("/login?next=/app");
  }

  // Signed in is not enough: the account must be the owner or an explicitly
  // authorised team member (DECISIONS D-043).
  const access = await getAccessState();
  if (access.status === "denied") {
    return <NoAccess email={session.user.email} userId={session.user.id} />;
  }
  if (access.status === "error") {
    return <NoAccess email={session.user.email} userId={session.user.id} problem={access.message} />;
  }

  return (
    <AppShell email={session.user.email}>
      {access.status === "legacy" ? <MigrationWarning /> : null}
      {children}
    </AppShell>
  );
}
