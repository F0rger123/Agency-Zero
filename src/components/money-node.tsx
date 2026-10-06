import { Money } from "@/components/money";

/** Drop-in for `moneyNode(...)` where the result is rendered as JSX: green symbol, animated amount. */
export function moneyNode(cents: number | null | undefined, currency = "USD") {
  return <Money cents={cents} currency={currency} />;
}
