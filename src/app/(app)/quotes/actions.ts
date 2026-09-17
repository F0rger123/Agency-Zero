"use server";

import { revalidatePath } from "next/cache";
import { createClient as createSupabaseClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { createPublicToken } from "@/lib/public-tokens";
import { field, optionalDate, optionalField, readableError, requiredText, type ActionState } from "@/lib/forms";

async function getUserClient(): Promise<{ supabase: Awaited<ReturnType<typeof createSupabaseClient>> } | { error: string }> {
  if (!isSupabaseConfigured()) return { error: "Supabase is not configured." };
  const supabase = await createSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();
  return user ? { supabase } : { error: "Your session has expired. Sign in again." };
}

const statuses = ["draft", "sent", "viewed", "accepted", "rejected", "expired"];

type ParsedLine = { description: string; qty: number; unit_amount_cents: number; is_recurring: boolean; billing_period: string | null; amount_cents: number; sort_order: number };

function parseMoney(value: string, label: string): number | ActionState {
  if (!value) return 0;
  const amount = Number(value);
  if (!Number.isFinite(amount) || amount < 0 || amount > 100000000) return { error: `${label} must be a valid non-negative amount.` };
  return Math.round(amount * 100);
}

function parseLines(formData: FormData): ParsedLine[] | ActionState {
  const raw = field(formData, "line_items");
  if (!raw) return { error: "Add at least one line item." };
  let items: unknown;
  try { items = JSON.parse(raw); } catch { return { error: "Line items are invalid." }; }
  if (!Array.isArray(items) || items.length === 0 || items.length > 100) return { error: "Add between one and one hundred line items." };
  const lines: ParsedLine[] = [];
  for (const [index, item] of items.entries()) {
    if (!item || typeof item !== "object") return { error: `Line item ${index + 1} is invalid.` };
    const row = item as Record<string, unknown>;
    const description = String(row.description ?? "").trim();
    const qty = Number(row.qty);
    const unit = Number(row.unit_amount);
    if (!description || description.length > 500) return { error: `Line item ${index + 1} needs a description.` };
    if (!Number.isFinite(qty) || qty <= 0 || qty > 1000000) return { error: `Line item ${index + 1} quantity is invalid.` };
    if (!Number.isFinite(unit) || unit < 0 || unit > 100000000) return { error: `Line item ${index + 1} price is invalid.` };
    const unitCents = Math.round(unit * 100);
    const amountCents = Math.round(qty * unitCents);
    const recurring = row.is_recurring === true;
    const billing = recurring && ["month", "quarter", "year"].includes(String(row.billing_period)) ? String(row.billing_period) : null;
    lines.push({ description, qty, unit_amount_cents: unitCents, is_recurring: recurring, billing_period: billing, amount_cents: amountCents, sort_order: index });
  }
  return lines;
}

function quoteValues(formData: FormData): { values: Record<string, unknown>; lines: ParsedLine[] } | ActionState {
  const title = requiredText(formData, "title", "Quote title", 200);
  const number = requiredText(formData, "number", "Quote number", 80);
  const clientId = field(formData, "client_id");
  if (typeof title !== "string") return title;
  if (typeof number !== "string") return number;
  if (!clientId) return { error: "Choose a client." };
  const status = field(formData, "status") || "draft";
  if (!statuses.includes(status)) return { error: "Choose a valid quote status." };
  const lines = parseLines(formData);
  if (!Array.isArray(lines)) return lines;
  const discount = parseMoney(field(formData, "discount_amount"), "Discount");
  if (typeof discount !== "number") return discount;
  const taxRate = Number(field(formData, "tax_rate") || 0);
  if (!Number.isFinite(taxRate) || taxRate < 0 || taxRate > 100) return { error: "Tax rate must be between 0 and 100 percent." };
  const subtotal = lines.reduce((sum, line) => sum + line.amount_cents, 0);
  if (discount > subtotal) return { error: "Discount cannot exceed the subtotal." };
  const currency = (field(formData, "currency") || "USD").toUpperCase();
  if (!/^[A-Z]{3}$/.test(currency)) return { error: "Currency must be a three-letter code such as USD." };
  const taxable = subtotal - discount;
  const tax = Math.round(taxable * taxRate / 100);
  return {
    values: {
      client_id: clientId, number, title, notes: optionalField(formData, "notes"), status,
      issued_on: optionalDate(formData, "issued_on") ?? new Date().toISOString().slice(0, 10),
      valid_until: optionalDate(formData, "valid_until"),
      currency,
      subtotal_cents: subtotal, discount_cents: discount, tax_rate: taxRate,
      tax_cents: tax, total_cents: taxable + tax,
    },
    lines,
  };
}

async function replaceLines(supabase: Awaited<ReturnType<typeof createSupabaseClient>>, quoteId: string, lines: ParsedLine[]): Promise<string | null> {
  const removed = await supabase.from("quote_line_items").delete().eq("quote_id", quoteId);
  if (removed.error) return removed.error.message;
  const inserted = await supabase.from("quote_line_items").insert(lines.map((line) => ({ ...line, quote_id: quoteId })));
  return inserted.error?.message ?? null;
}

export async function createQuoteAction(_previous: ActionState, formData: FormData): Promise<ActionState> {
  const parsed = quoteValues(formData);
  if (!("values" in parsed)) return parsed;
  const auth = await getUserClient(); if ("error" in auth) return auth;
  const token = createPublicToken();
  const { data, error } = await auth.supabase.from("quotes").insert({ ...parsed.values, public_token: token.token, public_token_hash: token.hash }).select("id").single();
  if (error) return { error: readableError(error.message) };
  const lineError = await replaceLines(auth.supabase, data.id, parsed.lines);
  if (lineError) return { error: readableError(lineError) };
  revalidatePath("/quotes"); revalidatePath("/");
  return { success: "Quote created." };
}

export async function updateQuoteAction(_previous: ActionState, formData: FormData): Promise<ActionState> {
  const id = field(formData, "id"); if (!id) return { error: "Quote ID is missing." };
  const parsed = quoteValues(formData); if (!("values" in parsed)) return parsed;
  const auth = await getUserClient(); if ("error" in auth) return auth;
  const { error } = await auth.supabase.from("quotes").update(parsed.values).eq("id", id);
  if (error) return { error: readableError(error.message) };
  const lineError = await replaceLines(auth.supabase, id, parsed.lines);
  if (lineError) return { error: readableError(lineError) };
  revalidatePath("/quotes"); revalidatePath(`/quotes/${id}`); revalidatePath("/");
  return { success: "Quote saved." };
}

export async function deleteQuoteAction(_previous: ActionState, formData: FormData): Promise<ActionState> {
  const id = field(formData, "id"); if (!id) return { error: "Quote ID is missing." };
  const auth = await getUserClient(); if ("error" in auth) return auth;
  const { error } = await auth.supabase.from("quotes").delete().eq("id", id);
  if (error) return { error: readableError(error.message) };
  revalidatePath("/quotes"); revalidatePath("/");
  return { success: "Quote deleted." };
}

export async function convertQuoteAction(_previous: ActionState, formData: FormData): Promise<ActionState> {
  const id = field(formData, "id"); if (!id) return { error: "Quote ID is missing." };
  const auth = await getUserClient(); if ("error" in auth) return auth;
  const { data, error } = await auth.supabase.rpc("convert_quote_to_project", { p_quote_id: id });
  if (error) return { error: readableError(error.message) };
  revalidatePath("/quotes"); revalidatePath(`/quotes/${id}`); revalidatePath("/projects"); revalidatePath("/");
  return { success: `Project created from quote${data ? `: ${data}` : "."}` };
}
