import type { Metadata } from "next";
import { createClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { hashPublicToken } from "@/lib/public-tokens";
import { isMissingTable } from "@/lib/forms";
import { MigrationsRequired, SetupRequired } from "@/components/states";
import { SignContractForm } from "./sign-form";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Contract" };
export default async function PublicContractPage({ params }: { params: Promise<{ token: string }> }) {
  if (!isSupabaseConfigured()) return <SetupRequired />; const { token } = await params; const supabase = await createClient(); const response = await supabase.rpc("get_public_contract", { p_token_hash: hashPublicToken(token) });
  if (response.error) { if (isMissingTable(response.error.message)) return <MigrationsRequired />; throw new Error(response.error.message); }
  if (!response.data) return <main className="mx-auto max-w-2xl px-6 py-16"><p className="text-xs font-medium uppercase tracking-widest text-muted-foreground">Agency Zero</p><h1 className="mt-4 text-2xl font-semibold">Contract not found</h1><p className="mt-2 text-sm text-muted-foreground">This link may be expired, revoked, or incorrect.</p></main>;
  const contract = response.data as { title: string; status: string; body: string; version: number; client_name: string; company: string | null; signed_at: string | null; signer_name: string | null };
  return <main className="mx-auto max-w-3xl px-6 py-12 sm:py-20"><header className="border-b border-border pb-10"><p className="text-xs font-medium uppercase tracking-widest text-muted-foreground">Agency Zero · Contract</p><h1 className="mt-5 text-3xl font-semibold tracking-tight">{contract.title}</h1><p className="mt-2 text-sm text-muted-foreground">For {contract.client_name}{contract.company ? `, ${contract.company}` : ""} · Version {contract.version}</p></header><article className="mt-10 whitespace-pre-wrap text-sm leading-7">{contract.body}</article>{contract.status === "sent" ? <SignContractForm token={token} /> : <p className="mt-10 border-t border-border pt-6 text-sm font-medium">This contract is {contract.status}{contract.signer_name ? ` and was signed by ${contract.signer_name}` : ""}.</p>}<footer className="mt-16 border-t border-border pt-5 text-xs text-muted-foreground">Electronic signing is recorded with a timestamp and preserved contract snapshot.</footer></main>;
}
