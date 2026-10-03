"use server";

import { revalidatePath } from "next/cache";
import { getUserClient, notFoundWhenNoRows } from "@/lib/actions";
import { field, optionalDate, optionalField, readableError, requiredText, type ActionState } from "@/lib/forms";

function money(value: string, label: string): number | ActionState {
  if (!value) return 0;
  const amount = Number(value);
  if (!Number.isFinite(amount) || amount < 0 || amount > 100000000)
    return { error: `${label} must be a valid non-negative amount.` };
  return Math.round(amount * 100);
}
type Line = { description: string; qty: number; unit_amount_cents: number; amount_cents: number; sort_order: number };
function lines(formData: FormData): Line[] | ActionState {
  const raw = field(formData, "line_items");
  if (!raw) return { error: "Add at least one invoice line item." };
  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch {
    return { error: "Invoice line items are invalid." };
  }
  if (!Array.isArray(parsed) || parsed.length === 0 || parsed.length > 100)
    return { error: "Add between one and one hundred line items." };
  const result: Line[] = [];
  for (const [index, item] of parsed.entries()) {
    if (!item || typeof item !== "object") return { error: `Line item ${index + 1} is invalid.` };
    const row = item as Record<string, unknown>;
    const description = String(row.description ?? "").trim();
    const qty = Number(row.qty);
    const unit = Number(row.unit_amount);
    if (
      !description ||
      description.length > 500 ||
      !Number.isFinite(qty) ||
      qty <= 0 ||
      qty > 1000000 ||
      !Number.isFinite(unit) ||
      unit < 0 ||
      unit > 100000000
    )
      return { error: `Line item ${index + 1} is invalid.` };
    const cents = Math.round(unit * 100);
    result.push({
      description,
      qty,
      unit_amount_cents: cents,
      amount_cents: Math.round(qty * cents),
      sort_order: index,
    });
  }
  return result;
}
function invoiceValues(formData: FormData): { values: Record<string, unknown>; lines: Line[] } | ActionState {
  const title = requiredText(formData, "title", "Invoice title", 200);
  const number = requiredText(formData, "number", "Invoice number", 80);
  const clientId = field(formData, "client_id");
  if (typeof title !== "string") return title;
  if (typeof number !== "string") return number;
  if (!clientId) return { error: "Choose a client." };
  const status = field(formData, "status") || "draft";
  if (!["draft", "sent", "partially_paid", "paid", "overdue", "void"].includes(status))
    return { error: "Choose a valid invoice status." };
  const invoiceLines = lines(formData);
  if (!Array.isArray(invoiceLines)) return invoiceLines;
  const discount = money(field(formData, "discount_amount"), "Discount");
  const tax = money(field(formData, "tax_amount"), "Tax");
  const deposit = money(field(formData, "deposit_amount"), "Deposit");
  if (typeof discount !== "number") return discount;
  if (typeof tax !== "number") return tax;
  if (typeof deposit !== "number") return deposit;
  const subtotal = invoiceLines.reduce((sum, item) => sum + item.amount_cents, 0);
  if (discount > subtotal) return { error: "Discount cannot exceed subtotal." };
  const currency = (field(formData, "currency") || "USD").toUpperCase();
  if (!/^[A-Z]{3}$/.test(currency)) return { error: "Currency must be a three-letter code such as USD." };
  const total = subtotal - discount + tax;
  return {
    values: {
      client_id: clientId,
      project_id: optionalField(formData, "project_id"),
      quote_id: optionalField(formData, "quote_id"),
      contract_id: optionalField(formData, "contract_id"),
      number,
      title,
      status,
      issued_on: optionalDate(formData, "issued_on") ?? new Date().toISOString().slice(0, 10),
      due_on: optionalDate(formData, "due_on") ?? new Date().toISOString().slice(0, 10),
      currency,
      subtotal_cents: subtotal,
      discount_cents: discount,
      tax_cents: tax,
      total_cents: total,
      deposit_cents: deposit,
    },
    lines: invoiceLines,
  };
}
function lineRows(invoiceLines: Line[]) {
  return invoiceLines.map((line) => ({ ...line }));
}

export async function createInvoiceAction(_previous: ActionState, formData: FormData): Promise<ActionState> {
  const parsed = invoiceValues(formData);
  if (!("values" in parsed)) return parsed;
  const auth = await getUserClient();
  if ("error" in auth) return auth;
  // Header + line items are saved in one transaction (migration 0015).
  const { error } = await auth.supabase.rpc("save_invoice", {
    p_id: null,
    p_header: parsed.values,
    p_lines: lineRows(parsed.lines),
  });
  if (error) return { error: readableError(error.message) };
  revalidatePath("/app/invoices");
  revalidatePath("/app");
  return { success: "Invoice created." };
}

export async function updateInvoiceAction(_previous: ActionState, formData: FormData): Promise<ActionState> {
  const id = field(formData, "id");
  if (!id) return { error: "Invoice ID is missing." };
  const parsed = invoiceValues(formData);
  if (!("values" in parsed)) return parsed;
  const auth = await getUserClient();
  if ("error" in auth) return auth;
  // The RPC keeps the recorded payments, rejects totals below them, and
  // rewrites the line items atomically.
  const { error } = await auth.supabase.rpc("save_invoice", {
    p_id: id,
    p_header: parsed.values,
    p_lines: lineRows(parsed.lines),
  });
  if (error) return { error: readableError(error.message) };
  revalidatePath("/app/invoices");
  revalidatePath(`/app/invoices/${id}`);
  revalidatePath("/app");
  return { success: "Invoice saved." };
}

/**
 * Only unpaid drafts may be deleted (enforced by the database too, migration
 * 0015). Issued invoices are financial records: set their status to Void.
 */
export async function deleteInvoiceAction(_previous: ActionState, formData: FormData): Promise<ActionState> {
  const id = field(formData, "id");
  if (!id) return { error: "Invoice ID is missing." };
  const auth = await getUserClient();
  if ("error" in auth) return auth;
  const current = await auth.supabase.from("invoices").select("status, paid_cents").eq("id", id).maybeSingle();
  if (current.error) return { error: readableError(current.error.message) };
  if (!current.data) return { error: "Invoice not found." };
  if (current.data.status !== "draft" || current.data.paid_cents > 0) {
    return { error: "Only unpaid draft invoices can be deleted. Edit the invoice and set its status to Void instead." };
  }
  const { error, count } = await auth.supabase.from("invoices").delete({ count: "exact" }).eq("id", id);
  if (error) return { error: readableError(error.message) };
  const missing = notFoundWhenNoRows(count, "Invoice");
  if (missing) return missing;
  revalidatePath("/app/invoices");
  return { success: "Draft invoice deleted." };
}
export async function recordPaymentAction(_previous: ActionState, formData: FormData): Promise<ActionState> {
  const invoiceId = field(formData, "invoice_id");
  if (!invoiceId) return { error: "Invoice ID is missing." };
  const amount = money(field(formData, "amount"), "Payment amount");
  if (typeof amount !== "number" || amount <= 0) return { error: "Payment amount must be greater than zero." };
  const method = field(formData, "method") || "other";
  const kind = field(formData, "kind") || "partial";
  if (!["bank_transfer", "cash", "card", "other"].includes(method))
    return { error: "Choose a valid manual payment method." };
  if (!["deposit", "partial", "full"].includes(kind)) return { error: "Choose a valid payment kind." };
  const auth = await getUserClient();
  if ("error" in auth) return auth;
  const invoice = await auth.supabase
    .from("invoices")
    .select("total_cents, paid_cents")
    .eq("id", invoiceId)
    .maybeSingle();
  if (invoice.error) return { error: readableError(invoice.error.message) };
  if (!invoice.data) return { error: "Invoice not found." };
  if (amount > invoice.data.total_cents - invoice.data.paid_cents)
    return { error: "Payment cannot exceed the remaining balance." };
  const { error } = await auth.supabase
    .from("payments")
    .insert({
      invoice_id: invoiceId,
      amount_cents: amount,
      paid_on: optionalDate(formData, "paid_on") ?? new Date().toISOString().slice(0, 10),
      method,
      kind,
      reference: optionalField(formData, "reference"),
      note: optionalField(formData, "note"),
    });
  if (error) return { error: readableError(error.message) };
  revalidatePath("/app/invoices");
  revalidatePath(`/app/invoices/${invoiceId}`);
  revalidatePath("/app");
  return { success: "Payment recorded." };
}
/**
 * Payments are a permanent ledger (migration 0016): they are voided with a
 * reason, never deleted or edited. A voided payment stays visible and is
 * excluded from the invoice totals.
 */
export async function voidPaymentAction(_previous: ActionState, formData: FormData): Promise<ActionState> {
  const id = field(formData, "id");
  const invoiceId = field(formData, "invoice_id");
  if (!id || !invoiceId) return { error: "Payment details are missing." };
  const reason = requiredText(formData, "reason", "Reason for voiding", 300);
  if (typeof reason !== "string") return reason;
  const auth = await getUserClient();
  if ("error" in auth) return auth;
  const { error, count } = await auth.supabase
    .from("payments")
    .update({ voided_at: new Date().toISOString(), void_reason: reason }, { count: "exact" })
    .eq("id", id)
    .is("voided_at", null);
  if (error) return { error: readableError(error.message) };
  const missing = notFoundWhenNoRows(count, "Payment");
  if (missing) return missing;
  revalidatePath("/app/invoices");
  revalidatePath(`/app/invoices/${invoiceId}`);
  revalidatePath("/app/clients");
  revalidatePath("/app");
  return { success: "Payment voided. It stays in the ledger but no longer counts toward the invoice." };
}

/**
 * One-step "payment received": creates a paid invoice + payment through `record_client_payment`
 * (migration 0020), so a one-time fee counts toward Total Revenue straight away.
 */
export async function recordClientPaymentAction(_previous: ActionState, formData: FormData): Promise<ActionState> {
  const clientId = field(formData, "client_id");
  const description = requiredText(formData, "description", "What the payment was for", 200);
  if (typeof description !== "string") return description;
  if (!clientId) return { error: "Client is missing." };
  const amount = money(field(formData, "amount"), "Amount");
  if (typeof amount !== "number") return amount;
  if (amount <= 0) return { error: "Enter an amount greater than zero." };
  const paidOn = optionalDate(formData, "paid_on");
  const method = field(formData, "method") || "other";
  const auth = await getUserClient();
  if ("error" in auth) return auth;
  const { error } = await auth.supabase.rpc("record_client_payment", {
    p_client_id: clientId,
    p_description: description,
    p_amount_cents: amount,
    p_paid_on: paidOn,
    p_method: method,
    p_project_id: optionalField(formData, "project_id"),
    p_reference: optionalField(formData, "reference"),
  });
  if (error) {
    if (/could not find the function|schema cache/i.test(error.message)) {
      return { error: "Recording payments needs database update 0020. Apply it in the Supabase SQL editor, then try again." };
    }
    return { error: readableError(error.message) };
  }
  revalidatePath("/app");
  revalidatePath("/app/invoices");
  revalidatePath("/app/clients");
  return { success: "Payment recorded. It now counts toward Total Revenue." };
}
