"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { hashPublicToken } from "@/lib/public-tokens";
import { field, readableError, type ActionState } from "@/lib/forms";

export async function signContractAction(_previous: ActionState, formData: FormData): Promise<ActionState> {
  if (!isSupabaseConfigured()) return { error: "This contract service is not configured." };
  const token = field(formData, "token"); const signerName = field(formData, "signer_name"); if (!token || !signerName) return { error: "Signer name is required." }; if (formData.get("agreement") !== "on") return { error: "Confirm the electronic-signature statement." };
  const supabase = await createClient(); const { error } = await supabase.rpc("sign_public_contract", { p_token_hash: hashPublicToken(token), p_signer_name: signerName });
  if (error) return { error: readableError(error.message) }; revalidatePath(`/c/${token}`); return { success: "Contract signed." };
}
