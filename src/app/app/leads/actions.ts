"use server";

import { revalidatePath } from "next/cache";
import { getUserClient, notFoundWhenNoRows } from "@/lib/actions";
import { field, readableError, type ActionState } from "@/lib/forms";

const STATUSES = ["new", "contacted", "dismissed"] as const;

/** Move a lead between the manual states (conversion has its own action). */
export async function setLeadStatusAction(_previous: ActionState, formData: FormData): Promise<ActionState> {
  const id = field(formData, "id");
  const status = field(formData, "status");
  if (!id) return { error: "Lead ID is missing." };
  if (!(STATUSES as readonly string[]).includes(status)) return { error: "Choose a valid status." };
  const auth = await getUserClient();
  if ("error" in auth) return auth;
  const { error, count } = await auth.supabase
    .from("leads")
    .update({ status }, { count: "exact" })
    .eq("id", id);
  if (error) return { error: readableError(error.message) };
  const missing = notFoundWhenNoRows(count, "Lead");
  if (missing) return missing;
  revalidatePath("/app/leads");
  revalidatePath("/app");
  return { success: "Lead updated." };
}

/** Lead → client + primary contact, atomically (migration 0019). */
export async function convertLeadAction(_previous: ActionState, formData: FormData): Promise<ActionState> {
  const id = field(formData, "id");
  if (!id) return { error: "Lead ID is missing." };
  const auth = await getUserClient();
  if ("error" in auth) return auth;
  const { error } = await auth.supabase.rpc("convert_lead_to_client", { p_lead_id: id });
  if (error) return { error: readableError(error.message) };
  revalidatePath("/app/leads");
  revalidatePath("/app/clients");
  revalidatePath("/app");
  return { success: "Converted to a client. Open it from Clients." };
}
