"use server";

import { revalidatePath } from "next/cache";
import { getUserClient, notFoundWhenNoRows } from "@/lib/actions";
import { field, readableError, requiredText, type ActionState } from "@/lib/forms";

const NEEDS_0026 = "Passkeys need database update 0026. Apply it in the Supabase SQL editor, then try again.";
const missing = (message: string) => /passkeys|schema cache/i.test(message);

/** Rename one of your own passkeys (RLS only lets you touch your own rows, and only the name column). */
export async function renamePasskeyAction(_previous: ActionState, formData: FormData): Promise<ActionState> {
  const id = field(formData, "id");
  const name = requiredText(formData, "name", "Name", 80);
  if (typeof name !== "string") return name;
  if (!id) return { error: "Passkey is missing." };
  const auth = await getUserClient();
  if ("error" in auth) return auth;
  const { error, count } = await auth.supabase.from("passkeys").update({ name }, { count: "exact" }).eq("id", id);
  if (error) return { error: missing(error.message) ? NEEDS_0026 : readableError(error.message) };
  const gone = notFoundWhenNoRows(count, "Passkey");
  if (gone) return gone;
  revalidatePath("/app/settings/security");
  return { success: "Renamed." };
}

/** Remove a passkey. Passwords keep working, so removing a lost device never locks you out. */
export async function removePasskeyAction(_previous: ActionState, formData: FormData): Promise<ActionState> {
  const id = field(formData, "id");
  if (!id) return { error: "Passkey is missing." };
  const auth = await getUserClient();
  if ("error" in auth) return auth;
  const { error, count } = await auth.supabase.from("passkeys").delete({ count: "exact" }).eq("id", id);
  if (error) return { error: missing(error.message) ? NEEDS_0026 : readableError(error.message) };
  const gone = notFoundWhenNoRows(count, "Passkey");
  if (gone) return gone;
  revalidatePath("/app/settings/security");
  return { success: "Passkey removed." };
}
