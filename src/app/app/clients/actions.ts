"use server";

import { revalidatePath } from "next/cache";
import { getUserClient, notFoundWhenNoRows } from "@/lib/actions";
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
  revalidatePath("/app/clients");
  revalidatePath("/app");
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
  const { error, count } = await auth.supabase.from("clients").update(values, { count: "exact" }).eq("id", id);
  if (error) return { error: readableError(error.message) };
  const missing = notFoundWhenNoRows(count, "Client");
  if (missing) return missing;
  revalidatePath("/app/clients");
  revalidatePath(`/app/clients/${id}`);
  revalidatePath("/app/projects");
  revalidatePath("/app/tasks");
  revalidatePath("/app");
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
  const { error, count } = await auth.supabase
    .from("clients")
    .update({ status: "archived", deleted_at: new Date().toISOString() }, { count: "exact" })
    .eq("id", id);
  if (error) return { error: readableError(error.message) };
  const missing = notFoundWhenNoRows(count, "Client");
  if (missing) return missing;
  revalidatePath("/app/clients");
  revalidatePath(`/app/clients/${id}`);
  revalidatePath("/app/projects");
  revalidatePath("/app");
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
  revalidatePath(`/app/clients/${clientId}`);
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
  const { error, count } = await auth.supabase.from("contacts").delete({ count: "exact" }).eq("id", id);
  if (error) return { error: readableError(error.message) };
  const missing = notFoundWhenNoRows(count, "Contact");
  if (missing) return missing;
  revalidatePath(`/app/clients/${clientId}`);
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
  revalidatePath(`/app/clients/${clientId}`);
  revalidatePath("/app");
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
  const { error, count } = await auth.supabase.from("client_notes").delete({ count: "exact" }).eq("id", id);
  if (error) return { error: readableError(error.message) };
  const missing = notFoundWhenNoRows(count, "Note");
  if (missing) return missing;
  revalidatePath(`/app/clients/${clientId}`);
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
  revalidatePath(`/app/clients/${clientId}`);
  revalidatePath("/app");
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
  const { error, count } = await auth.supabase.from("communications").delete({ count: "exact" }).eq("id", id);
  if (error) return { error: readableError(error.message) };
  const missing = notFoundWhenNoRows(count, "Record");
  if (missing) return missing;
  revalidatePath(`/app/clients/${clientId}`);
  return { success: "Activity removed." };
}

const BILLING_INTERVALS = ["monthly", "quarterly", "yearly"];

/**
 * Assign (or re-assign) a catalogue service to a client.
 *
 * Since migration 0010 an assignment stores the amount as billed together with
 * its interval; MRR is derived from that pair with the same rule the database
 * uses (`normalized_monthly_cents`): quarterly ÷ 3, yearly ÷ 12. The legacy
 * `monthly_amount_cents` column is kept in sync so older screens stay correct.
 */
export async function assignServiceAction(
  _previous: ActionState,
  formData: FormData
): Promise<ActionState> {
  const clientId = field(formData, "client_id");
  const serviceId = field(formData, "service_id");
  if (!clientId || !serviceId) return { error: "Choose a service." };

  const billing = field(formData, "billing") || "one_off";
  if (!["one_off", "recurring"].includes(billing)) return { error: "Choose a valid billing type." };

  const interval = field(formData, "billing_interval") || "monthly";
  if (!BILLING_INTERVALS.includes(interval)) return { error: "Choose a valid billing interval." };

  const rawAmount = field(formData, "amount");
  const amount = rawAmount ? Number(rawAmount) : null;
  if (amount !== null && (!Number.isFinite(amount) || amount < 0 || amount > 100000000)) {
    return { error: "Amount must be a valid non-negative number." };
  }

  const amountCents = billing === "recurring" && amount !== null ? Math.round(amount * 100) : null;
  const monthlyCents =
    amountCents === null
      ? null
      : interval === "quarterly"
        ? Math.round(amountCents / 3)
        : interval === "yearly"
          ? Math.round(amountCents / 12)
          : amountCents;

  const auth = await getUserClient();
  if ("error" in auth) return auth;
  const { error } = await auth.supabase.from("client_services").upsert(
    {
      client_id: clientId,
      service_id: serviceId,
      billing,
      billing_interval: interval,
      amount_cents: amountCents,
      monthly_amount_cents: monthlyCents,
      started_on: optionalDate(formData, "started_on"),
    },
    { onConflict: "client_id,service_id" }
  );
  if (error) return { error: readableError(error.message) };
  revalidatePath(`/app/clients/${clientId}`);
  revalidatePath("/app/clients");
  revalidatePath("/app/services");
  revalidatePath("/app");
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
  const { error, count } = await auth.supabase.from("client_services").delete({ count: "exact" }).eq("id", id);
  if (error) return { error: readableError(error.message) };
  const missing = notFoundWhenNoRows(count, "Service assignment");
  if (missing) return missing;
  revalidatePath(`/app/clients/${clientId}`);
  revalidatePath("/app/clients");
  revalidatePath("/app/services");
  revalidatePath("/app");
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
  revalidatePath(`/app/clients/${clientId}`);
  return { success: "File uploaded." };
}

export async function deleteClientFileAction(
  _previous: ActionState,
  formData: FormData
): Promise<ActionState> {
  const id = field(formData, "id");
  const clientId = field(formData, "client_id");
  if (!id || !clientId) return { error: "File details are missing." };
  const auth = await getUserClient();
  if ("error" in auth) return auth;
  // Never trust a client-supplied storage path: resolve it from the file row.
  const row = await auth.supabase.from("client_files").select("storage_path").eq("id", id).maybeSingle();
  if (row.error) return { error: readableError(row.error.message) };
  if (!row.data) return { error: "File not found, or it was already removed." };
  const path = row.data.storage_path;
  const removed = await auth.supabase.storage.from("client-files").remove([path]);
  if (removed.error) return { error: readableError(removed.error.message) };
  const { error, count } = await auth.supabase.from("client_files").delete({ count: "exact" }).eq("id", id);
  if (error) return { error: readableError(error.message) };
  const missing = notFoundWhenNoRows(count, "File");
  if (missing) return missing;
  revalidatePath(`/app/clients/${clientId}`);
  return { success: "File removed." };
}
