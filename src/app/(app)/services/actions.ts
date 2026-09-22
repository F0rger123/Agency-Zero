"use server";

import { revalidatePath } from "next/cache";
import { createClient as createSupabaseClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import {
  field,
  optionalField,
  readableError,
  requiredText,
  type ActionState,
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

const BILLING_TYPES = ["one_off", "recurring"];
const BILLING_INTERVALS = ["monthly", "quarterly", "yearly"];

function serviceFields(
  formData: FormData
): ActionState | Record<string, string | number | boolean | null> {
  const name = requiredText(formData, "name", "Service name", 160);
  if (typeof name !== "string") return name;

  const description = optionalField(formData, "description");
  if (description && description.length > 1000) {
    return { error: "Description must be 1000 characters or fewer." };
  }

  const defaultBilling = field(formData, "default_billing") || "one_off";
  if (!BILLING_TYPES.includes(defaultBilling)) {
    return { error: "Choose one-off or recurring billing." };
  }

  const billingInterval = field(formData, "billing_interval") || "monthly";
  if (!BILLING_INTERVALS.includes(billingInterval)) {
    return { error: "Choose a valid billing interval (monthly, quarterly, or yearly)." };
  }

  // Price is entered in currency units (D-022) and stored in cents (D-012).
  const priceRaw = field(formData, "default_price");
  let defaultPriceCents: number | null = null;
  if (priceRaw) {
    const price = Number(priceRaw);
    if (!Number.isFinite(price) || price < 0 || price > 100000000) {
      return { error: "Default price must be a valid non-negative amount." };
    }
    defaultPriceCents = Math.round(price * 100);
  }

  // Duration is entered in hours and stored in minutes (D-015/D-022).
  const hoursRaw = field(formData, "default_estimated_hours");
  let defaultEstimatedMinutes: number | null = null;
  if (hoursRaw) {
    const hours = Number(hoursRaw);
    if (!Number.isFinite(hours) || hours < 0 || hours > 24000) {
      return { error: "Default estimated time must be zero or a positive number of hours." };
    }
    defaultEstimatedMinutes = Math.round(hours * 60);
  }

  return {
    name,
    description,
    default_billing: defaultBilling,
    billing_interval: billingInterval,
    default_price_cents: defaultPriceCents,
    default_estimated_minutes: defaultEstimatedMinutes,
    active: formData.get("active") !== "off",
  };
}

function revalidateServicePaths() {
  revalidatePath("/services");
  revalidatePath("/clients");
  revalidatePath("/quotes");
  revalidatePath("/");
}

export async function createServiceAction(
  _previous: ActionState,
  formData: FormData
): Promise<ActionState> {
  const values = serviceFields(formData);
  if ("error" in values) return values;
  const auth = await getUserClient();
  if ("error" in auth) return auth;

  const { error } = await auth.supabase.from("services").insert(values);
  if (error) {
    if (error.code === "23505") return { error: "A service with that name already exists." };
    return { error: readableError(error.message) };
  }
  revalidateServicePaths();
  return { success: "Service created." };
}

export async function updateServiceAction(
  _previous: ActionState,
  formData: FormData
): Promise<ActionState> {
  const id = field(formData, "id");
  if (!id) return { error: "Service ID is missing." };
  const values = serviceFields(formData);
  if ("error" in values) return values;
  const auth = await getUserClient();
  if ("error" in auth) return auth;

  const { error } = await auth.supabase.from("services").update(values).eq("id", id);
  if (error) {
    if (error.code === "23505") return { error: "A service with that name already exists." };
    return { error: readableError(error.message) };
  }
  revalidateServicePaths();
  return { success: "Service saved." };
}

/**
 * Activate / deactivate (archive) a service without deleting it.
 *
 * Deactivating keeps every quote line, assignment, and historical report that
 * references the service intact — it only removes it from the pickers for new
 * work (`get_service_directory` marks it inactive and the assign form only
 * offers active services).
 */
export async function setServiceActiveAction(
  _previous: ActionState,
  formData: FormData
): Promise<ActionState> {
  const id = field(formData, "id");
  if (!id) return { error: "Service ID is missing." };
  const nextRaw = field(formData, "active");
  if (!["true", "false"].includes(nextRaw)) return { error: "Choose a valid service state." };
  const active = nextRaw === "true";

  const auth = await getUserClient();
  if ("error" in auth) return auth;
  const { error } = await auth.supabase.from("services").update({ active }).eq("id", id);
  if (error) return { error: readableError(error.message) };
  revalidateServicePaths();
  return { success: active ? "Service reactivated." : "Service deactivated." };
}
