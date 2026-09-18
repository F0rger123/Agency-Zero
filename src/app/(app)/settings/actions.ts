"use server";

import { revalidatePath } from "next/cache";
import { createClient as createSupabaseClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { field, optionalField, readableError, type ActionState } from "@/lib/forms";

async function getUserClient(): Promise<
  | { supabase: Awaited<ReturnType<typeof createSupabaseClient>>; userId: string }
  | { error: string }
> {
  if (!isSupabaseConfigured()) return { error: "Supabase is not configured." };
  const supabase = await createSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  return user ? { supabase, userId: user.id } : { error: "Your session has expired. Sign in again." };
}

const CURRENCY_PATTERN = /^[A-Z]{3}$/;
const TIMEZONE_PATTERN = /^[A-Za-z0-9/_+-]{1,60}$/;

function parseCurrency(raw: string, label: string): string | ActionState {
  const currency = raw.toUpperCase();
  if (!CURRENCY_PATTERN.test(currency)) {
    return { error: `${label} must be a three-letter code such as USD.` };
  }
  return currency;
}

export async function updateProfileAction(
  _previous: ActionState,
  formData: FormData
): Promise<ActionState> {
  const fullName = optionalField(formData, "full_name");
  if (fullName && fullName.length > 160) {
    return { error: "Name must be 160 characters or fewer." };
  }
  const timezone = field(formData, "timezone") || "UTC";
  if (!TIMEZONE_PATTERN.test(timezone)) {
    return { error: "Timezone must be an IANA-style name such as Europe/Berlin or UTC." };
  }
  const currency = parseCurrency(field(formData, "currency") || "USD", "Currency");
  if (typeof currency !== "string") return currency;

  // Capacity is entered in hours per day (D-022) and stored as minutes (D-015).
  const capacityRaw = field(formData, "daily_capacity_hours");
  const capacityHours = Number(capacityRaw);
  if (!capacityRaw || !Number.isFinite(capacityHours) || capacityHours < 0 || capacityHours > 24) {
    return { error: "Daily capacity must be between 0 and 24 hours." };
  }
  const capacityMinutes = Math.round(capacityHours * 60);

  const auth = await getUserClient();
  if ("error" in auth) return auth;
  const { error } = await auth.supabase
    .from("profiles")
    .update({
      full_name: fullName,
      timezone,
      currency,
      default_daily_capacity_minutes: capacityMinutes,
    })
    .eq("id", auth.userId);
  if (error) return { error: readableError(error.message) };
  revalidatePath("/settings");
  revalidatePath("/workload");
  return { success: "Profile saved." };
}

export async function updateSettingsAction(
  _previous: ActionState,
  formData: FormData
): Promise<ActionState> {
  const businessName = optionalField(formData, "business_name");
  if (businessName && businessName.length > 200) {
    return { error: "Business name must be 200 characters or fewer." };
  }
  const address = optionalField(formData, "address");
  if (address && address.length > 500) {
    return { error: "Address must be 500 characters or fewer." };
  }
  const taxId = optionalField(formData, "tax_id");
  if (taxId && taxId.length > 80) {
    return { error: "Tax ID must be 80 characters or fewer." };
  }
  const defaultCurrency = parseCurrency(
    field(formData, "default_currency") || "USD",
    "Default currency"
  );
  if (typeof defaultCurrency !== "string") return defaultCurrency;
  const taxRateRaw = field(formData, "default_tax_rate") || "0";
  const taxRate = Number(taxRateRaw);
  if (!Number.isFinite(taxRate) || taxRate < 0 || taxRate > 100) {
    return { error: "Default tax rate must be between 0 and 100 percent." };
  }
  const quotePrefix = field(formData, "quote_prefix") || "Q-";
  const invoicePrefix = field(formData, "invoice_prefix") || "INV-";
  if (quotePrefix.length > 20 || invoicePrefix.length > 20) {
    return { error: "Document prefixes must be 20 characters or fewer." };
  }

  const auth = await getUserClient();
  if ("error" in auth) return auth;
  const { error } = await auth.supabase
    .from("settings")
    .update({
      business_name: businessName,
      address,
      tax_id: taxId,
      default_currency: defaultCurrency,
      default_tax_rate: taxRate,
      quote_prefix: quotePrefix,
      invoice_prefix: invoicePrefix,
    })
    .eq("id", 1);
  if (error) {
    return {
      error: readableError(error.message),
    };
  }
  revalidatePath("/settings");
  revalidatePath("/");
  return { success: "Workspace settings saved." };
}
