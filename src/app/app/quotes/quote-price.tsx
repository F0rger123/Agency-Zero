import { moneyLabel } from "@/lib/format";
import { periodPhrase, summarizeQuoteLines, type StoredLine } from "@/lib/quote-math";

/**
 * What the customer pays, worked out from the included items: the total, how much of it repeats and how often,
 * and any optional extras on top. (The stored header total used to add every option together.)
 */
export function QuotePrice({
  lines,
  discountCents,
  taxRate,
  currency,
}: {
  lines: StoredLine[];
  discountCents: number;
  taxRate: number;
  currency: string;
}) {
  if (lines.length === 0) return <span className="text-muted-foreground">—</span>;
  const summary = summarizeQuoteLines(lines, discountCents, taxRate);
  return (
    <span className="block">
      <span className="font-medium">{moneyLabel(summary.total, currency)}</span>
      {summary.recurring.map(([period, cents]) => (
        <span key={period} className="block text-xs text-muted-foreground">
          includes {moneyLabel(cents, currency)} {periodPhrase(period)}
        </span>
      ))}
      {summary.optional > 0 ? (
        <span className="block text-xs text-muted-foreground">+ {moneyLabel(summary.optional, currency)} optional</span>
      ) : null}
    </span>
  );
}
