"use server";

import { revalidatePath } from "next/cache";
import { createClient as createSupabaseClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { createPublicToken } from "@/lib/public-tokens";
import { field, optionalDate, optionalField, readableError, requiredText, type ActionState } from "@/lib/forms";

async function getUserClient(): Promise<{ supabase: Awaited<ReturnType<typeof createSupabaseClient>> } | { error: string }> {
  if (!isSupabaseConfigured()) return { error: "Supabase is not configured." };
  const supabase = await createSupabaseClient(); const { data: { user } } = await supabase.auth.getUser();
  return user ? { supabase } : { error: "Your session has expired. Sign in again." };
}
const statuses = ["draft", "sent", "signed", "void"];
function values(formData: FormData): ActionState | Record<string, unknown> {
  const title = requiredText(formData, "title", "Contract title", 200); const body = requiredText(formData, "body", "Contract body", 100000); const clientId = field(formData, "client_id");
  if (typeof title !== "string") return title; if (typeof body !== "string") return body; if (!clientId) return { error: "Choose a client." };
  const status = field(formData, "status") || "draft"; if (!statuses.includes(status)) return { error: "Choose a valid contract status." }; if (status === "signed") return { error: "Contracts become signed only through the public electronic-signature flow." };
  return { client_id: clientId, quote_id: optionalField(formData, "quote_id"), project_id: optionalField(formData, "project_id"), title, status, body, template_id: optionalField(formData, "template_id"), token_expires_at: optionalDate(formData, "token_expires_at") ? `${optionalDate(formData, "token_expires_at")}T23:59:59Z` : null };
}

export async function createTemplateAction(_previous: ActionState, formData: FormData): Promise<ActionState> {
  const name = requiredText(formData, "name", "Template name", 160); const body = requiredText(formData, "body", "Template body", 100000); if (typeof name !== "string") return name; if (typeof body !== "string") return body;
  const auth = await getUserClient(); if ("error" in auth) return auth; const { error } = await auth.supabase.from("contract_templates").insert({ name, body, active: formData.get("active") !== "off" }); if (error) return { error: readableError(error.message) }; revalidatePath("/contracts"); return { success: "Template created." };
}
export async function updateTemplateAction(_previous: ActionState, formData: FormData): Promise<ActionState> {
  const id = field(formData, "id"); const name = requiredText(formData, "name", "Template name", 160); const body = requiredText(formData, "body", "Template body", 100000); if (!id) return { error: "Template ID is missing." }; if (typeof name !== "string") return name; if (typeof body !== "string") return body;
  const auth = await getUserClient(); if ("error" in auth) return auth; const { error } = await auth.supabase.from("contract_templates").update({ name, body, active: formData.get("active") === "on" }).eq("id", id); if (error) return { error: readableError(error.message) }; revalidatePath("/contracts"); return { success: "Template saved." };
}
export async function deleteTemplateAction(_previous: ActionState, formData: FormData): Promise<ActionState> { const id = field(formData, "id"); if (!id) return { error: "Template ID is missing." }; const auth = await getUserClient(); if ("error" in auth) return auth; const { error } = await auth.supabase.from("contract_templates").delete().eq("id", id); if (error) return { error: readableError(error.message) }; revalidatePath("/contracts"); return { success: "Template deleted." }; }

export async function createContractAction(_previous: ActionState, formData: FormData): Promise<ActionState> {
  const parsed = values(formData); if (!("body" in parsed)) return parsed; const auth = await getUserClient(); if ("error" in auth) return auth; const token = createPublicToken();
  const { data, error } = await auth.supabase.from("contracts").insert({ ...parsed, public_token: token.token, public_token_hash: token.hash }).select("id, version").single(); if (error) return { error: readableError(error.message) };
  const version = await auth.supabase.from("contract_versions").insert({ contract_id: data.id, version: data.version, body: parsed.body }); if (version.error) return { error: readableError(version.error.message) };
  revalidatePath("/contracts"); revalidatePath("/"); return { success: "Contract created." };
}

export async function updateContractAction(_previous: ActionState, formData: FormData): Promise<ActionState> {
  const id = field(formData, "id"); if (!id) return { error: "Contract ID is missing." }; const parsed = values(formData); if (!("body" in parsed)) return parsed; const auth = await getUserClient(); if ("error" in auth) return auth;
  const current = await auth.supabase.from("contracts").select("version, status").eq("id", id).maybeSingle(); if (current.error) return { error: readableError(current.error.message) }; if (!current.data) return { error: "Contract not found." }; if (current.data.status === "signed") return { error: "Signed contracts are immutable; create a new version instead." };
  const version = Number(current.data.version) + 1; const updated = await auth.supabase.from("contracts").update({ ...parsed, version }).eq("id", id); if (updated.error) return { error: readableError(updated.error.message) };
  const history = await auth.supabase.from("contract_versions").insert({ contract_id: id, version, body: parsed.body }); if (history.error) return { error: readableError(history.error.message) };
  revalidatePath("/contracts"); revalidatePath(`/contracts/${id}`); return { success: `Contract saved as version ${version}.` };
}
export async function deleteContractAction(_previous: ActionState, formData: FormData): Promise<ActionState> { const id = field(formData, "id"); if (!id) return { error: "Contract ID is missing." }; const auth = await getUserClient(); if ("error" in auth) return auth; const { error } = await auth.supabase.from("contracts").delete().eq("id", id); if (error) return { error: readableError(error.message) }; revalidatePath("/contracts"); return { success: "Contract deleted." }; }
