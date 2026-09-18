export type ActionState = {
  error?: string;
  success?: string;
};

export function field(formData: FormData, name: string): string {
  return String(formData.get(name) ?? "").trim();
}

export function optionalField(formData: FormData, name: string): string | null {
  const value = field(formData, name);
  return value || null;
}

export function optionalDate(formData: FormData, name: string): string | null {
  const value = optionalField(formData, name);
  if (!value) return null;
  const parsed = new Date(`${value}T00:00:00Z`);
  return Number.isNaN(parsed.getTime()) ? null : value;
}

export function nonNegativeMinutes(formData: FormData, name: string): number | null {
  const value = optionalField(formData, name);
  if (!value) return null;
  const minutes = Number(value);
  return Number.isInteger(minutes) && minutes >= 0 ? minutes : null;
}

export function nonNegativeCents(formData: FormData, name: string): number | null {
  const value = optionalField(formData, name);
  if (!value) return null;
  const cents = Number(value);
  return Number.isInteger(cents) && cents >= 0 ? cents : null;
}

export function requiredText(
  formData: FormData,
  name: string,
  label: string,
  maxLength = 500
): string | ActionState {
  const value = field(formData, name);
  if (!value) return { error: `${label} is required.` };
  if (value.length > maxLength) return { error: `${label} must be ${maxLength} characters or fewer.` };
  return value;
}

export function validEmail(value: string | null): boolean {
  return !value || /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}

export function validHttpUrl(value: string | null): boolean {
  if (!value) return true;
  try {
    const url = new URL(value);
    return url.protocol === "http:" || url.protocol === "https:";
  } catch {
    return false;
  }
}

export function isMissingTable(message: string): boolean {
  return message.includes("does not exist") || message.includes("schema cache");
}

export function readableError(message: string): string {
  if (isMissingTable(message)) {
    return "The latest database migration is not applied yet. Apply the files in supabase/migrations/ in order.";
  }
  if (message.toLowerCase().includes("storage")) {
    return "Client file storage is not configured. Apply migration 0005, then try again.";
  }
  return message;
}
