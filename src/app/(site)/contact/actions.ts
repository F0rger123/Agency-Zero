"use server";

import { createHash } from "node:crypto";
import { headers } from "next/headers";
import { createClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { site } from "@/lib/site-config";
import { notifyOwnerOfLead } from "@/lib/lead-notify";
import { BUDGETS, SERVICE_OPTIONS, SOCIAL_FIELDS, TIMELINES } from "./options";

export type LeadState = { error?: string; success?: string };

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/** Accepts "example.com", "www.example.com" or a full URL; returns a clean https URL, or null if it is not a web address. */
function cleanWebsite(raw: string): string | null {
  const value = raw.trim();
  if (!value) return null;
  const withScheme = /^https?:\/\//i.test(value) ? value : `https://${value}`;
  try {
    const url = new URL(withScheme);
    if ((url.protocol !== "http:" && url.protocol !== "https:") || !url.hostname.includes(".")) return null;
    return url.toString().replace(/\/$/, "");
  } catch {
    return null;
  }
}

/** A social profile can be a link or an @handle; keep it as typed, trimmed and single-line. */
function cleanSocial(raw: string): string {
  return raw.replace(/[\r\n]+/g, " ").trim().slice(0, 200);
}

/**
 * Public project inquiry → `public.submit_lead()` (migration 0019).
 *
 * Defence in depth, because this is an unauthenticated write:
 *   - honeypot field and a minimum fill time (bots submit instantly) — silently
 *     "succeed" so bots learn nothing;
 *   - strict server validation and a service whitelist (re-checked in SQL);
 *   - SQL-side rate limits keyed by email and a hashed IP+UA fingerprint (the
 *     raw IP is never stored);
 *   - the function is the ONLY anonymous write path; `leads` is owner-only.
 */
export async function submitLeadAction(_previous: LeadState, formData: FormData): Promise<LeadState> {
  const text = (name: string, max: number) => String(formData.get(name) ?? "").trim().slice(0, max);

  // Honeypot + timing
  const startedAt = Number(formData.get("started_at"));
  const tooFast = Number.isFinite(startedAt) && Date.now() - startedAt < 2500;
  if (text("company_url", 200) || tooFast) return { success: "Thanks — I'll be in touch shortly." };

  const name = text("name", 160);
  const email = text("email", 254).toLowerCase();
  const business = text("business", 200);
  const phone = text("phone", 40);
  const budget = text("budget", 60);
  const timeline = text("timeline", 60);
  const noWebsite = formData.get("no_website") === "on";
  const noSocial = formData.get("no_social") === "on";
  const detailsText = text("details", 3000);
  const services = formData.getAll("services").map(String);

  if (!name) return { error: "Please tell me your name." };
  if (!EMAIL.test(email)) return { error: "Please enter a valid email address." };
  if (services.some((s) => !SERVICE_OPTIONS.some((option) => option.value === s))) {
    return { error: "Please choose from the listed services." };
  }
  if (budget && !(BUDGETS as readonly string[]).includes(budget)) return { error: "Please choose a listed budget range." };
  if (timeline && !(TIMELINES as readonly string[]).includes(timeline)) return { error: "Please choose a listed start time." };

  // Online presence: validated here, then written into the inquiry text so it lands in the CRM lead as-is.
  let website: string | null = null;
  if (!noWebsite) {
    const rawWebsite = text("website", 300);
    if (rawWebsite) {
      website = cleanWebsite(rawWebsite);
      if (!website) return { error: "That website address doesn't look right. Try something like yourbusiness.com." };
    }
  }
  const socials = noSocial
    ? []
    : SOCIAL_FIELDS.map((field) => ({ label: field.label, value: cleanSocial(String(formData.get(field.name) ?? "")) })).filter(
        (item) => item.value,
      );
  const presence = [
    noWebsite ? "Website: none yet" : website ? `Website: ${website}` : "",
    noSocial ? "Social: none" : socials.length ? `Social: ${socials.map((item) => `${item.label} ${item.value}`).join(" | ")}` : "",
    timeline ? `Start: ${timeline}` : "",
  ].filter(Boolean);
  const details = [detailsText, presence.length ? `\n${presence.join("\n")}` : ""].join("\n").trim().slice(0, 4000);

  if (!detailsText && services.length === 0) return { error: "Tell me a little about what you need." };

  if (!isSupabaseConfigured()) {
    return { error: `This form is temporarily unavailable. Please email ${site.email}.` };
  }

  const requestHeaders = await headers();
  const ip = requestHeaders.get("cf-connecting-ip") ?? requestHeaders.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "";
  const fingerprint = createHash("sha256")
    .update(`${ip}|${requestHeaders.get("user-agent") ?? ""}|agency-zero-lead`)
    .digest("hex");

  const supabase = await createClient();
  const { error } = await supabase.rpc("submit_lead", {
    p_name: name,
    p_business: business || null,
    p_email: email,
    p_phone: phone || null,
    p_services: services,
    p_budget: budget || null,
    p_details: details || null,
    p_submitter_hash: fingerprint,
  });

  if (error) {
    if (error.message.includes("Too many requests")) {
      return { error: "You've sent a few messages already — please try again in a little while, or email me directly." };
    }
    if (/does not exist|schema cache|Could not find the function/i.test(error.message)) {
      return { error: `This form is temporarily unavailable. Please email ${site.email}.` };
    }
    if (/Please enter|Invalid/.test(error.message)) return { error: error.message };
    return { error: `Something went wrong. Please email ${site.email}.` };
  }

  // The lead is saved. Now (best effort) tell the owner by email; failures are logged, never shown.
  const notified = await notifyOwnerOfLead({ name, business, email, phone, services, budget, details });
  if (!notified.sent && notified.reason !== "not configured") {
    console.error("[lead] email notification failed:", notified.reason);
  }

  return { success: "Thanks — your message is in. I'll reply within one working day." };
}
