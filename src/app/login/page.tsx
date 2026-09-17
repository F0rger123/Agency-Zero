import type { Metadata } from "next";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { SetupRequired } from "@/components/states";
import { LoginForm } from "./login-form";

export const metadata: Metadata = { title: "Sign in" };
// Read env at request time so a re-configure does not require a rebuild.
export const dynamic = "force-dynamic";

export default function LoginPage() {
  if (!isSupabaseConfigured()) {
    return <SetupRequired />;
  }
  return <LoginForm />;
}
