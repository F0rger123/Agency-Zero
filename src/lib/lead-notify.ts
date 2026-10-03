import "server-only";

/**
 * Email the owner when a website lead arrives (optional; the lead is ALWAYS saved
 * to the CRM first, so a failure here never loses an inquiry).
 *
 * Uses Resend's HTTP API (no dependency). Configure in Cloudflare → Worker →
 * Settings → Variables and secrets:
 *   RESEND_API_KEY      (secret)   from resend.com → API Keys
 *   LEAD_NOTIFY_EMAIL   (variable) where notifications go, e.g. drummerforger@gmail.com
 *   LEAD_FROM_EMAIL     (variable, optional) a verified sender, e.g. "Agency Zero <leads@yourdomain.com>".
 *                       Defaults to Resend's test sender (onboarding@resend.dev), which can only
 *                       deliver to the email address the Resend account was created with.
 */
export type LeadForEmail = {
  name: string;
  business: string;
  email: string;
  phone: string;
  services: string[];
  budget: string;
  details: string;
};

export async function notifyOwnerOfLead(lead: LeadForEmail): Promise<{ sent: boolean; reason?: string }> {
  const key = process.env.RESEND_API_KEY;
  const to = process.env.LEAD_NOTIFY_EMAIL;
  if (!key || !to) return { sent: false, reason: "not configured" };

  const from = process.env.LEAD_FROM_EMAIL || "Agency Zero <onboarding@resend.dev>";
  const lines = [
    `New website inquiry`,
    ``,
    `Name:     ${lead.name}`,
    `Business: ${lead.business || "—"}`,
    `Email:    ${lead.email}`,
    `Phone:    ${lead.phone || "—"}`,
    `Needs:    ${lead.services.length ? lead.services.join(", ") : "—"}`,
    `Budget:   ${lead.budget || "—"}`,
    ``,
    lead.details || "(no details)",
    ``,
    `Reply to this email to answer ${lead.name}. It is also saved in the CRM under Leads.`,
  ];

  try {
    const response = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        from,
        to: [to],
        reply_to: lead.email,
        subject: `New inquiry: ${lead.name}${lead.business ? ` (${lead.business})` : ""}`,
        text: lines.join("\n"),
      }),
      signal: AbortSignal.timeout(5000),
    });
    return response.ok ? { sent: true } : { sent: false, reason: `Resend responded ${response.status}` };
  } catch (error) {
    return { sent: false, reason: error instanceof Error ? error.message : "request failed" };
  }
}
