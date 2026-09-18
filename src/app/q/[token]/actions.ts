"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { hashPublicToken } from "@/lib/public-tokens";
import { field, readableError, type ActionState } from "@/lib/forms";

export async function respondToQuoteAction(_previous: ActionState, formData: FormData): Promise<ActionState> {
  if (!isSupabaseConfigured()) return { error: "This quote service is not configured." };
  const token = field(formData, "token"); const decision = field(formData, "decision");
  if (!token || !["accepted", "rejected"].includes(decision)) return { error: "The response is invalid." };
  const supabase = await createClient();
  const { error } = await supabase.rpc("respond_public_quote", { p_token_hash: hashPublicToken(token), p_decision: decision });
  if (error) return { error: readableError(error.message) };
  revalidatePath(`/q/${token}`);
  return { success: decision === "accepted" ? "Quote accepted." : "Quote rejected." };
}
