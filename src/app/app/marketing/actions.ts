"use server";

import { revalidatePath } from "next/cache";
import { getUserClient, isActionError, moneyToCentsField, notFoundWhenNoRows, wholeNumberField } from "@/lib/actions";
import { field, optionalDate, optionalField, readableError, requiredText, type ActionState } from "@/lib/forms";

const channels = ["meta_ads", "google_ads", "seo", "email", "other"];
const statuses = ["planned", "active", "paused", "completed"];

function refresh() {
  revalidatePath("/app/marketing");
}

export async function createCampaignAction(_previous: ActionState, formData: FormData): Promise<ActionState> {
  const name = requiredText(formData, "name", "Campaign name", 160);
  if (typeof name !== "string") return name;
  const clientId = field(formData, "client_id");
  if (!clientId) return { error: "Choose a client." };
  const channel = field(formData, "channel");
  if (!channels.includes(channel)) return { error: "Choose a channel." };
  const budget = moneyToCentsField(formData, "budget", "Budget");
  if (isActionError(budget)) return budget;
  const startsOn = optionalDate(formData, "starts_on");
  const endsOn = optionalDate(formData, "ends_on");
  if (startsOn && endsOn && endsOn < startsOn) return { error: "The end date must be on or after the start date." };
  const auth = await getUserClient();
  if ("error" in auth) return auth;
  const { error } = await auth.supabase.from("marketing_campaigns").insert({
    client_id: clientId,
    name,
    channel,
    status: statuses.includes(field(formData, "status")) ? field(formData, "status") : "planned",
    objective: optionalField(formData, "objective"),
    starts_on: startsOn,
    ends_on: endsOn,
    budget_cents: budget,
  });
  if (error) return { error: readableError(error.message) };
  refresh();
  return { success: "Campaign created." };
}

export async function updateCampaignResultsAction(_previous: ActionState, formData: FormData): Promise<ActionState> {
  const id = field(formData, "id");
  if (!id) return { error: "Campaign ID is missing." };
  const status = field(formData, "status");
  if (!statuses.includes(status)) return { error: "Choose a status." };
  const spend = moneyToCentsField(formData, "spend", "Spend");
  if (isActionError(spend)) return spend;
  const leads = wholeNumberField(formData, "leads_count", "Leads", 1000000);
  if (isActionError(leads)) return leads;
  const auth = await getUserClient();
  if ("error" in auth) return auth;
  const { error, count } = await auth.supabase
    .from("marketing_campaigns")
    .update(
      { status, spend_cents: spend ?? 0, leads_count: leads ?? 0, results_note: optionalField(formData, "results_note") },
      { count: "exact" },
    )
    .eq("id", id);
  if (error) return { error: readableError(error.message) };
  const missing = notFoundWhenNoRows(count, "Campaign");
  if (missing) return missing;
  refresh();
  return { success: "Campaign updated." };
}

export async function deleteCampaignAction(_previous: ActionState, formData: FormData): Promise<ActionState> {
  const id = field(formData, "id");
  if (!id) return { error: "Campaign ID is missing." };
  const auth = await getUserClient();
  if ("error" in auth) return auth;
  const { error, count } = await auth.supabase.from("marketing_campaigns").delete({ count: "exact" }).eq("id", id);
  if (error) return { error: readableError(error.message) };
  const missing = notFoundWhenNoRows(count, "Campaign");
  if (missing) return missing;
  refresh();
  return { success: "Campaign removed." };
}
