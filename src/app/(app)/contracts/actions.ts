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

type ParsedContract = {
  client_id: string;
  quote_id: string | null;
  project_id: string | null;
  title: string;
  status: string;
  body: string | null;
  template_id: string | null;
  token_expires_at: string | null;
};

/**
 * Template placeholders rendered server-side before a contract body is saved
 * (documented in the contract templates UI and the seeded template):
 * {{business_name}}, {{client_name}}, {{client_company}}, {{contract_title}},
 * {{quote_number}}, {{date}}.
 */
function renderPlaceholders(body: string, data: {
  businessName: string | null;
  clientName: string;
  clientCompany: string | null;
  contractTitle: string;
  quoteNumber: string | null;
}): string {
  const today = new Date().toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric", timeZone: "UTC" });
  return body
    .replaceAll("{{business_name}}", data.businessName || "Agency Zero")
    .replaceAll("{{client_name}}", data.clientName)
    .replaceAll("{{client_company}}", data.clientCompany ? ` of ${data.clientCompany}` : "")
    .replaceAll("{{contract_title}}", data.contractTitle)
    .replaceAll("{{quote_number}}", data.quoteNumber ?? "")
    .replaceAll("{{date}}", today);
}

function parseContract(formData: FormData): ParsedContract | ActionState {
  const title = requiredText(formData, "title", "Contract title", 200);
  if (typeof title !== "string") return title;
  const clientId = field(formData, "client_id");
  if (!clientId) return { error: "Choose a client." };
  const status = field(formData, "status") || "draft";
  if (!statuses.includes(status)) return { error: "Choose a valid contract status." };
  if (status === "signed") return { error: "Contracts become signed only through the public electronic-signature flow." };
  const rawBody = String(formData.get("body") ?? "").trim();
  const templateId = optionalField(formData, "template_id");
  if (rawBody.length > 100000) return { error: "Contract body must be 100000 characters or fewer." };
  if (!rawBody && !templateId) return { error: "Write the contract body or choose a template to start from." };
  return {
    client_id: clientId,
    quote_id: optionalField(formData, "quote_id"),
    project_id: optionalField(formData, "project_id"),
    title,
    status,
    body: rawBody || null,
    template_id: templateId,
    token_expires_at: optionalDate(formData, "token_expires_at") ? `${optionalDate(formData, "token_expires_at")}T23:59:59Z` : null,
  };
}

/** Resolves the final contract body: template start + placeholder rendering. */
async function resolveBody(
  supabase: Awaited<ReturnType<typeof createSupabaseClient>>,
  parsed: ParsedContract
): Promise<string | ActionState> {
  let body = parsed.body;
  if (!body && parsed.template_id) {
    const template = await supabase.from("contract_templates").select("body").eq("id", parsed.template_id).maybeSingle();
    if (template.error) return { error: readableError(template.error.message) };
    if (!template.data) return { error: "The chosen template was not found." };
    body = template.data.body as string;
  }
  if (!body) return { error: "Write the contract body or choose a template to start from." };

  const [clientResponse, settingsResponse, quoteResponse] = await Promise.all([
    supabase.from("clients").select("name, company").eq("id", parsed.client_id).maybeSingle(),
    supabase.from("settings").select("business_name").eq("id", 1).maybeSingle(),
    parsed.quote_id
      ? supabase.from("quotes").select("number").eq("id", parsed.quote_id).maybeSingle()
      : Promise.resolve({ data: null, error: null }),
  ]);
  if (clientResponse.error) return { error: readableError(clientResponse.error.message) };
  if (!clientResponse.data) return { error: "The chosen client was not found." };
  if (settingsResponse.error) return { error: readableError(settingsResponse.error.message) };
  if (quoteResponse.error) return { error: readableError(quoteResponse.error.message) };

  return renderPlaceholders(body, {
    businessName: settingsResponse.data?.business_name ?? null,
    clientName: clientResponse.data.name,
    clientCompany: clientResponse.data.company,
    contractTitle: parsed.title,
    quoteNumber: quoteResponse.data ? (quoteResponse.data as { number: string }).number : null,
  });
}

export async function createTemplateAction(_previous: ActionState, formData: FormData): Promise<ActionState> {
  const name = requiredText(formData, "name", "Template name", 160); const body = requiredText(formData, "body", "Template body", 100000);
  if (typeof name !== "string") return name; if (typeof body !== "string") return body;
  const auth = await getUserClient(); if ("error" in auth) return auth;
  const { error } = await auth.supabase.from("contract_templates").insert({ name, body, active: formData.get("active") !== "off" });
  if (error) return { error: readableError(error.message) };
  revalidatePath("/contracts"); return { success: "Template created." };
}

export async function updateTemplateAction(_previous: ActionState, formData: FormData): Promise<ActionState> {
  const id = field(formData, "id"); const name = requiredText(formData, "name", "Template name", 160); const body = requiredText(formData, "body", "Template body", 100000);
  if (!id) return { error: "Template ID is missing." }; if (typeof name !== "string") return name; if (typeof body !== "string") return body;
  const auth = await getUserClient(); if ("error" in auth) return auth;
  const { error } = await auth.supabase.from("contract_templates").update({ name, body, active: formData.get("active") === "on" }).eq("id", id);
  if (error) return { error: readableError(error.message) };
  revalidatePath("/contracts"); return { success: "Template saved." };
}

export async function deleteTemplateAction(_previous: ActionState, formData: FormData): Promise<ActionState> {
  const id = field(formData, "id"); if (!id) return { error: "Template ID is missing." };
  const auth = await getUserClient(); if ("error" in auth) return auth;
  const { error } = await auth.supabase.from("contract_templates").delete().eq("id", id);
  if (error) return { error: readableError(error.message) };
  revalidatePath("/contracts"); return { success: "Template deleted." };
}

export async function createContractAction(_previous: ActionState, formData: FormData): Promise<ActionState> {
  const parsed = parseContract(formData); if (!("client_id" in parsed)) return parsed;
  const auth = await getUserClient(); if ("error" in auth) return auth;
  const body = await resolveBody(auth.supabase, parsed); if (typeof body !== "string") return body;
  const token = createPublicToken();
  const { data, error } = await auth.supabase
    .from("contracts")
    .insert({ ...parsed, body, public_token: token.token, public_token_hash: token.hash })
    .select("id, version")
    .single();
  if (error) return { error: readableError(error.message) };
  const version = await auth.supabase.from("contract_versions").insert({ contract_id: data.id, version: data.version, body });
  if (version.error) return { error: readableError(version.error.message) };
  revalidatePath("/contracts"); revalidatePath("/"); return { success: "Contract created." };
}

export async function updateContractAction(_previous: ActionState, formData: FormData): Promise<ActionState> {
  const id = field(formData, "id"); if (!id) return { error: "Contract ID is missing." };
  const parsed = parseContract(formData); if (!("client_id" in parsed)) return parsed;
  const auth = await getUserClient(); if ("error" in auth) return auth;
  const current = await auth.supabase.from("contracts").select("version, status").eq("id", id).maybeSingle();
  if (current.error) return { error: readableError(current.error.message) };
  if (!current.data) return { error: "Contract not found." };
  if (current.data.status === "signed") return { error: "Signed contracts are immutable; create a new contract instead." };
  const body = await resolveBody(auth.supabase, parsed); if (typeof body !== "string") return body;
  const version = Number(current.data.version) + 1;
  const updated = await auth.supabase.from("contracts").update({ ...parsed, body, version }).eq("id", id);
  if (updated.error) return { error: readableError(updated.error.message) };
  const history = await auth.supabase.from("contract_versions").insert({ contract_id: id, version, body });
  if (history.error) return { error: readableError(history.error.message) };
  revalidatePath("/contracts"); revalidatePath(`/contracts/${id}`);
  return { success: `Contract saved as version ${version}.` };
}

export async function deleteContractAction(_previous: ActionState, formData: FormData): Promise<ActionState> {
  const id = field(formData, "id"); if (!id) return { error: "Contract ID is missing." };
  const auth = await getUserClient(); if ("error" in auth) return auth;
  const current = await auth.supabase.from("contracts").select("status").eq("id", id).maybeSingle();
  if (current.error) return { error: readableError(current.error.message) };
  if (current.data?.status === "signed") return { error: "Signed contracts cannot be deleted; they are a permanent record." };
  const { error } = await auth.supabase.from("contracts").delete().eq("id", id);
  if (error) return { error: readableError(error.message) };
  revalidatePath("/contracts"); return { success: "Contract deleted." };
}

/** Rotate the public signing link: revokes the old token, issues a fresh one. */
export async function regenerateContractTokenAction(_previous: ActionState, formData: FormData): Promise<ActionState> {
  const id = field(formData, "id"); if (!id) return { error: "Contract ID is missing." };
  const auth = await getUserClient(); if ("error" in auth) return auth;
  const token = createPublicToken();
  const { error } = await auth.supabase
    .from("contracts")
    .update({ public_token: token.token, public_token_hash: token.hash, token_expires_at: null })
    .eq("id", id);
  if (error) return { error: readableError(error.message) };
  revalidatePath("/contracts"); revalidatePath(`/contracts/${id}`);
  return { success: "New signing link generated — the previous link no longer works." };
}
