"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { hashPublicToken } from "@/lib/public-tokens";
import { field, optionalField, readableError, type ActionState } from "@/lib/forms";

const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export async function respondToQuoteAction(
  _previous: ActionState,
  formData: FormData
): Promise<ActionState> {
  if (!isSupabaseConfigured()) return { error: "This quote service is not configured." };
  const token = field(formData, "token");
  const decision = field(formData, "decision");
  if (!token || !["accepted", "rejected"].includes(decision)) return { error: "The response is invalid." };

  // The customer-selected optional/choice line items (UUIDs); the RPC
  // re-validates every id against the quote's own selectable items.
  let selected: string[] = [];
  if (decision === "accepted") {
    let parsed: unknown = [];
    try {
      parsed = JSON.parse(field(formData, "selected_item_ids") || "[]");
    } catch {
      return { error: "The selection could not be read. Reload the page and try again." };
    }
    if (!Array.isArray(parsed)) return { error: "The selection is invalid." };
    selected = parsed.map(String).filter((value) => UUID_PATTERN.test(value));
  }

  const respondedBy = optionalField(formData, "responded_by");

  const supabase = await createClient();
  const { error } = await supabase.rpc("respond_public_quote", {
    p_token_hash: hashPublicToken(token),
    p_decision: decision,
    p_selected_item_ids: decision === "accepted" ? selected : null,
    p_responded_by: respondedBy,
  });
  if (error) return { error: readableError(error.message) };
  revalidatePath(`/q/${token}`);
  return { success: decision === "accepted" ? "Quote accepted. The agency has been notified." : "Quote rejected. The agency has been notified." };
}
