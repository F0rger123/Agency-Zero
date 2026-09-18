"use server";

import { revalidatePath } from "next/cache";
import { createClient as createSupabaseClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import {
  field,
  optionalDate,
  optionalField,
  readableError,
  requiredText,
  type ActionState,
  validEmail,
  validHttpUrl,
} from "@/lib/forms";

async function getUserClient(): Promise<
  | { supabase: Awaited<ReturnType<typeof createSupabaseClient>> }
  | { error: string }
> {
  if (!isSupabaseConfigured()) return { error: "Supabase is not configured." };
  const supabase = await createSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  return user ? { supabase } : { error: "Your session has expired. Sign in again." };
}

function clientFields(formData: FormData): ActionState | Record<string, string | null> {
  const name = requiredText(formData, "name", "Client name", 160);
  if (typeof name !== "string") return name;
  const email = optionalField(formData, "email");
  if (!validEmail(email)) return { error: "Enter a valid client email address." };
  const website = optionalField(formData, "website");
  if (!validHttpUrl(website)) return { error: "Website must be a valid http or https URL." };
  const status = field(formData, "status") || "lead";
  if (!["lead", "active", "past", "archived"].includes(status)) {
    return { error: "Choose a valid client status." };
  }
  return {
    name,
    status,
    company: optionalField(formData, "company"),
    email,
    phone: optionalField(formData, "phone"),
    website,
    source: optionalField(formData, "source"),
    notes_summary: optionalField(formData, "notes_summary"),
  };
}

export async function createClientAction(
  _previous: ActionState,
  formData: FormData
): Promise<ActionState> {
  const values = clientFields(formData);
  if ("error" in values) return values;
  const auth = await getUserClient();
  if ("error" in auth) return auth;
  const { error } = await auth.supabase.from("clients").insert(values);
  if (error) return { error: readableError(error.message) };
  revalidatePath("/clients");
  revalidatePath("/");
  return { success: "Client created." };
}

export async function updateClientAction(
  _previous: ActionState,
  formData: FormData
): Promise<ActionState> {
  const id = field(formData, "id");
  if (!id) return { error: "Client ID is missing." };
  const values = clientFields(formData);
  if ("error" in values) return values;
  const auth = await getUserClient();
  if ("error" in auth) return auth;
  const { error } = await auth.supabase.from("clients").update(values).eq("id", id);
  if (error) return { error: readableError(error.message) };
  revalidatePath("/clients");
  revalidatePath(`/clients/${id}`);
  revalidatePath("/projects");
  revalidatePath("/tasks");
  revalidatePath("/");
  return { success: "Client saved." };
}

export async function archiveClientAction(
  _previous: ActionState,
  formData: FormData
): Promise<ActionState> {
  const id = field(formData, "id");
  if (!id) return { error: "Client ID is missing." };
  const auth = await getUserClient();
  if ("error" in auth) return auth;
  const { error } = await auth.supabase
    .from("clients")
    .update({ status: "archived", deleted_at: new Date().toISOString() })
    .eq("id", id);
  if (error) return { error: readableError(error.message) };
  revalidatePath("/clients");
  revalidatePath(`/clients/${id}`);
  revalidatePath("/projects");
  revalidatePath("/");
  return { success: "Client archived." };
}

export async function createContactAction(
  _previous: ActionState,
  formData: FormData
): Promise<ActionState> {
  const clientId = field(formData, "client_id");
  if (!clientId) return { error: "Client ID is missing." };
  const name = requiredText(formData, "name", "Contact name", 160);
  if (typeof name !== "string") return name;
  const email = optionalField(formData, "email");
  if (!validEmail(email)) return { error: "Enter a valid contact email address." };
  const auth = await getUserClient();
  if ("error" in auth) return auth;
  const { error } = await auth.supabase.from("contacts").insert({
    client_id: clientId,
    name,
    role: optionalField(formData, "role"),
    email,
    phone: optionalField(formData, "phone"),
    is_primary: formData.get("is_primary") === "on",
  });
  if (error) return { error: readableError(error.message) };
  revalidatePath(`/clients/${clientId}`);
  return { success: "Contact added." };
}

export async function deleteContactAction(
  _previous: ActionState,
  formData: FormData
): Promise<ActionState> {
  const id = field(formData, "id");
  const clientId = field(formData, "client_id");
  if (!id || !clientId) return { error: "Contact details are missing." };
  const auth = await getUserClient();
  if ("error" in auth) return auth;
  const { error } = await auth.supabase.from("contacts").delete().eq("id", id);
  if (error) return { error: readableError(error.message) };
  revalidatePath(`/clients/${clientId}`);
  return { success: "Contact removed." };
}

export async function createNoteAction(
  _previous: ActionState,
  formData: FormData
): Promise<ActionState> {
  const clientId = field(formData, "client_id");
  const body = requiredText(formData, "body", "Note", 5000);
  if (!clientId) return { error: "Client ID is missing." };
  if (typeof body !== "string") return body;
  const auth = await getUserClient();
  if ("error" in auth) return auth;
  const { error } = await auth.supabase.from("client_notes").insert({
    client_id: clientId,
    body,
    pinned: formData.get("pinned") === "on",
  });
  if (error) return { error: readableError(error.message) };
  revalidatePath(`/clients/${clientId}`);
  revalidatePath("/");
  return { success: "Note added." };
}

export async function deleteNoteAction(
  _previous: ActionState,
  formData: FormData
): Promise<ActionState> {
  const id = field(formData, "id");
  const clientId = field(formData, "client_id");
  if (!id || !clientId) return { error: "Note details are missing." };
  const auth = await getUserClient();
  if ("error" in auth) return auth;
  const { error } = await auth.supabase.from("client_notes").delete().eq("id", id);
  if (error) return { error: readableError(error.message) };
  revalidatePath(`/clients/${clientId}`);
  return { success: "Note removed." };
}

export async function createCommunicationAction(
  _previous: ActionState,
  formData: FormData
): Promise<ActionState> {
  const clientId = field(formData, "client_id");
  const summary = requiredText(formData, "summary", "Summary", 2000);
  if (!clientId) return { error: "Client ID is missing." };
  if (typeof summary !== "string") return summary;
  const channel = field(formData, "channel") || "other";
  const direction = field(formData, "direction") || "out";
  if (!["call", "email", "meeting", "message", "other"].includes(channel)) {
    return { error: "Choose a valid communication channel." };
  }
  if (!["in", "out"].includes(direction)) return { error: "Choose a valid direction." };
  const occurredAt = optionalField(formData, "occurred_at");
  const auth = await getUserClient();
  if ("error" in auth) return auth;
  const { error } = await auth.supabase.from("communications").insert({
    client_id: clientId,
    contact_id: optionalField(formData, "contact_id"),
    channel,
    direction,
    summary,
    occurred_at: occurredAt ? new Date(occurredAt).toISOString() : new Date().toISOString(),
  });
  if (error) return { error: readableError(error.message) };
  revalidatePath(`/clients/${clientId}`);
  revalidatePath("/");
  return { success: "Activity logged." };
}

export async function deleteCommunicationAction(
  _previous: ActionState,
  formData: FormData
): Promise<ActionState> {
  const id = field(formData, "id");
  const clientId = field(formData, "client_id");
  if (!id || !clientId) return { error: "Activity details are missing." };
  const auth = await getUserClient();
  if ("error" in auth) return auth;
  const { error } = await auth.supabase.from("communications").delete().eq("id", id);
  if (error) return { error: readableError(error.message) };
  revalidatePath(`/clients/${clientId}`);
  return { success: "Activity removed." };
}

export async function assignServiceAction(
  _previous: ActionState,
  formData: FormData
): Promise<ActionState> {
  const clientId = field(formData, "client_id");
  const serviceId = field(formData, "service_id");
  if (!clientId || !serviceId) return { error: "Choose a service." };
  const rawAmount = field(formData, "monthly_amount");
  const amount = rawAmount ? Number(rawAmount) : null;
  if (amount !== null && (!Number.isFinite(amount) || amount < 0 || amount > 100000000)) {
    return { error: "Monthly amount must be a valid positive amount." };
  }
  const billing = field(formData, "billing") || "one_off";
  if (!["one_off", "recurring"].includes(billing)) return { error: "Choose a valid billing type." };
  const auth = await getUserClient();
  if ("error" in auth) return auth;
  const { error } = await auth.supabase.from("client_services").upsert(
    {
      client_id: clientId,
      service_id: serviceId,
      billing,
      monthly_amount_cents: billing === "recurring" && amount !== null ? Math.round(amount * 100) : null,
      started_on: optionalDate(formData, "started_on"),
    },
    { onConflict: "client_id,service_id" }
  );
  if (error) return { error: readableError(error.message) };
  revalidatePath(`/clients/${clientId}`);
  return { success: "Service saved." };
}

export async function removeServiceAction(
  _previous: ActionState,
  formData: FormData
): Promise<ActionState> {
  const id = field(formData, "id");
  const clientId = field(formData, "client_id");
  if (!id || !clientId) return { error: "Service details are missing." };
  const auth = await getUserClient();
  if ("error" in auth) return auth;
  const { error } = await auth.supabase.from("client_services").delete().eq("id", id);
  if (error) return { error: readableError(error.message) };
  revalidatePath(`/clients/${clientId}`);
  return { success: "Service removed." };
}

export async function uploadClientFileAction(
  _previous: ActionState,
  formData: FormData
): Promise<ActionState> {
  const clientId = field(formData, "client_id");
  const fileValue = formData.get("file");
  if (!clientId) return { error: "Client ID is missing." };
  if (!(fileValue instanceof File) || fileValue.size === 0) return { error: "Choose a file to upload." };
  if (fileValue.size > 10 * 1024 * 1024) return { error: "Files must be 10 MB or smaller." };
  const auth = await getUserClient();
  if ("error" in auth) return auth;
  const safeName = fileValue.name.replace(/[^a-zA-Z0-9._-]/g, "-").slice(0, 160);
  const path = `${clientId}/${crypto.randomUUID()}-${safeName}`;
  const upload = await auth.supabase.storage.from("client-files").upload(path, fileValue, {
    contentType: fileValue.type || "application/octet-stream",
    upsert: false,
  });
  if (upload.error) return { error: readableError(upload.error.message) };
  const { error } = await auth.supabase.from("client_files").insert({
    client_id: clientId,
    file_name: fileValue.name,
    storage_path: path,
    mime_type: fileValue.type || null,
    size_bytes: fileValue.size,
  });
  if (error) {
    await auth.supabase.storage.from("client-files").remove([path]);
    return { error: readableError(error.message) };
  }
  revalidatePath(`/clients/${clientId}`);
  return { success: "File uploaded." };
}

export async function deleteClientFileAction(
  _previous: ActionState,
  formData: FormData
): Promise<ActionState> {
  const id = field(formData, "id");
  const clientId = field(formData, "client_id");
  const path = field(formData, "storage_path");
  if (!id || !clientId || !path) return { error: "File details are missing." };
  const auth = await getUserClient();
  if ("error" in auth) return auth;
  const removed = await auth.supabase.storage.from("client-files").remove([path]);
  if (removed.error) return { error: readableError(removed.error.message) };
  const { error } = await auth.supabase.from("client_files").delete().eq("id", id);
  if (error) return { error: readableError(error.message) };
  revalidatePath(`/clients/${clientId}`);
  return { success: "File removed." };
}
