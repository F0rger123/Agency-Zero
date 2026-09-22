/**
 * Shared display formatting (MASTER_SPEC §3 — grayscale, literal numbers).
 *
 * Conventions enforced here:
 *  - money is stored in integer minor units (D-012) and rendered as currency;
 *  - durations are stored in minutes (D-015) and rendered as hours;
 *  - dates arrive as `YYYY-MM-DD` (date columns) or ISO timestamps and are
 *    rendered in UTC-stable form so a date never shifts by timezone.
 */

export function moneyLabel(cents: number | null | undefined, currency = "USD"): string {
  if (cents == null) return "—";
  try {
    return new Intl.NumberFormat("en-US", { style: "currency", currency }).format(cents / 100);
  } catch {
    return `${(cents / 100).toFixed(2)} ${currency}`;
  }
}

export function dateLabel(value: string | null | undefined): string {
  if (!value) return "—";
  const parsed = new Date(value.includes("T") ? value : `${value}T00:00:00Z`);
  if (Number.isNaN(parsed.getTime())) return "—";
  return new Intl.DateTimeFormat("en", { dateStyle: "medium", timeZone: "UTC" }).format(parsed);
}

export function dateTimeLabel(value: string | null | undefined): string {
  if (!value) return "—";
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return "—";
  return new Intl.DateTimeFormat("en", {
    dateStyle: "medium",
    timeStyle: "short",
    timeZone: "UTC",
  }).format(parsed);
}

export function hoursLabel(minutes: number | null | undefined): string {
  if (minutes == null) return "—";
  return `${Math.round((minutes / 60) * 10) / 10} h`;
}

export function fileSizeLabel(bytes: number | null | undefined): string {
  if (bytes == null) return "—";
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 102.4) / 10} KB`;
  return `${Math.round(bytes / 104857.6) / 10} MB`;
}

export function relativeLabel(value: string | null | undefined, now = new Date()): string {
  if (!value) return "—";
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return "—";
  const diffDays = Math.round((parsed.getTime() - now.getTime()) / 86400000);
  if (diffDays === 0) return "today";
  if (diffDays === -1) return "yesterday";
  if (diffDays === 1) return "tomorrow";
  if (diffDays < 0) return `${Math.abs(diffDays)} days ago`;
  return `in ${diffDays} days`;
}

export function billingIntervalLabel(interval: string | null | undefined): string {
  switch (interval) {
    case "quarterly":
      return "quarterly";
    case "yearly":
      return "yearly";
    default:
      return "monthly";
  }
}

/** `YYYY-MM-DD` for "today" in UTC — the app's single date convention. */
export function todayIso(): string {
  return new Date().toISOString().slice(0, 10);
}
