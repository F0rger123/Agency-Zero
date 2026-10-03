import type { Metadata } from "next";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { SetupRequired } from "@/components/states";
import { safeNextPath } from "@/lib/routes";
import { LoginForm } from "./login-form";

export const metadata: Metadata = { title: "Sign in" };
// Read env at request time so a re-configure does not require a rebuild.
export const dynamic = "force-dynamic";

export default async function LoginPage({ searchParams }: { searchParams: Promise<{ next?: string }> }) {
  if (!isSupabaseConfigured()) {
    return <SetupRequired />;
  }
  const { next } = await searchParams;
  return <LoginForm next={safeNextPath(next)} />;
}
