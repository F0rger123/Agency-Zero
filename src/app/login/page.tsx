import type { Metadata } from "next";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { SetupRequired } from "@/components/states";
import { safeNextPath } from "@/lib/routes";
import { passkeysConfigured } from "@/lib/passkeys/server";
import { LoginForm } from "./login-form";

export const metadata: Metadata = { title: "Sign in", robots: { index: false, follow: false } };
// Read env at request time so a re-configure does not require a rebuild.
export const dynamic = "force-dynamic";

export default async function LoginPage({ searchParams }: { searchParams: Promise<{ next?: string }> }) {
  if (!isSupabaseConfigured()) {
    return <SetupRequired />;
  }
  const { next } = await searchParams;
  return <LoginForm next={safeNextPath(next)} passkeysEnabled={passkeysConfigured()} />;
}
