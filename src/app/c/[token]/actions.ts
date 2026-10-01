"use server";

import { revalidatePath } from "next/cache";
import { headers } from "next/headers";
import { createClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { hashPublicToken } from "@/lib/public-tokens";
import { field, readableError, type ActionState } from "@/lib/forms";
import { CONSENT_TEXT } from "./consent";

export async function signContractAction(_previous: ActionState, formData: FormData): Promise<ActionState> {
  if (!isSupabaseConfigured()) return { error: "This contract service is not configured." };
  const token = field(formData, "token");
  const signerName = field(formData, "signer_name");
  if (!token || !signerName) return { error: "Signer name is required." };
  if (formData.get("agreement") !== "on") return { error: "Confirm the electronic-signature statement." };
  // Signature evidence (migration 0016): where/how the signature was made and
  // exactly which consent statement the signer agreed to.
  const requestHeaders = await headers();
  const forwarded = requestHeaders.get("x-forwarded-for")?.split(",")[0]?.trim();
  const signerIp = requestHeaders.get("cf-connecting-ip") ?? forwarded ?? null;
  const supabase = await createClient();
  const { error } = await supabase.rpc("sign_public_contract", {
    p_token_hash: hashPublicToken(token),
    p_signer_name: signerName,
    p_signer_ip: signerIp,
    p_signer_user_agent: requestHeaders.get("user-agent"),
    p_consent_text: CONSENT_TEXT,
  });
  if (error) return { error: readableError(error.message) };
  revalidatePath(`/c/${token}`);
  return { success: "Contract signed." };
}

/** Called by <ViewBeacon> from a real browser; never from page render. */
export async function markContractViewedAction(token: string): Promise<void> {
  if (!isSupabaseConfigured() || !token) return;
  const supabase = await createClient();
  await supabase.rpc("mark_public_contract_viewed", { p_token_hash: hashPublicToken(token) });
}
