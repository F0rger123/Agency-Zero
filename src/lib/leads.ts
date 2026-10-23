/**
 * Heuristic for submissions that are almost certainly tests or junk, so the Leads page can flag them
 * for review. It only flags; nothing is ever deleted automatically.
 */
export type LeadLike = {
  name: string;
  business?: string | null;
  email: string | null;
  phone?: string | null;
  details?: string | null;
};

const TEST_WORDS = /\b(test|testing|asdf|qwerty|lorem|ipsum|dummy|sample|fake|demo|foo|bar|example)\b/i;
const TEST_EMAIL_DOMAINS = /@(example\.(com|org|net)|test\.com|mailinator\.com|yopmail\.com|tempmail\.[a-z]+)$/i;

export function looksLikeTestLead(lead: LeadLike): boolean {
  const name = lead.name.trim();
  if (name.length < 2) return true;
  if (TEST_WORDS.test(name)) return true;
  if (lead.business && TEST_WORDS.test(lead.business)) return true;
  if (lead.email && TEST_EMAIL_DOMAINS.test(lead.email.trim())) return true;
  if (lead.email && /^(test|asdf|qwerty|foo|demo)[\w.+-]*@/i.test(lead.email.trim())) return true;
  if (lead.phone) {
    const digits = lead.phone.replace(/\D/g, "");
    if (digits.length >= 7 && /^(\d)\1+$/.test(digits)) return true;
    if (/^(555|0000|1234)/.test(digits.replace(/^1/, "")) && digits.length <= 10) return true;
  }
  if (lead.details && /^(test|asdf|testing)[\s.!]*$/i.test(lead.details.trim())) return true;
  return false;
}
