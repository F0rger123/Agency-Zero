import Link from "next/link";
import type { ReactNode } from "react";
import { moneyNode } from "@/components/money-node";

/** A bordered card for the lower half of the home screen. */
export function Panel({ children, className = "" }: { children: ReactNode; className?: string }) {
  return <div className={`min-w-0 rounded-2xl border-[1.5px] border-foreground/30 bg-background p-5 sm:p-6 ${className}`}>{children}</div>;
}

function PanelHeader({ title, href, link }: { title: string; href: string; link: string }) {
  return (
    <div className="flex items-baseline justify-between gap-4">
      <h2 className="text-base font-semibold tracking-tight">{title}</h2>
      <Link href={href} prefetch className="text-xs text-muted-foreground underline decoration-border underline-offset-4 hover:text-foreground">
        {link}
      </Link>
    </div>
  );
}

export type AgendaEvent = { id: string; title: string; type: string; starts_at: string };
export type ReminderRow = { id: string; message: string; due_at: string };
export type InvoiceRow = {
  id: string;
  number: string;
  title: string;
  due_on: string;
  balance_cents: number;
  currency: string;
  clients: { name: string } | { name: string }[] | null;
};

const when = (iso: string) =>
  new Intl.DateTimeFormat("en", { weekday: "short", month: "short", day: "numeric", hour: "numeric", minute: "2-digit", timeZone: "UTC" }).format(new Date(iso));

function Empty({ children }: { children: ReactNode }) {
  return <p className="mt-4 rounded-xl border border-dashed border-border px-4 py-6 text-center text-sm text-muted-foreground">{children}</p>;
}

export function AgendaPanel({ events }: { events: AgendaEvent[] | null }) {
  if (events === null) return null;
  return (
    <Panel>
      <PanelHeader title="Coming up" href="/app/calendar" link="Calendar" />
      {events.length === 0 ? (
        <Empty>Nothing on the calendar.</Empty>
      ) : (
        <ul className="mt-4 space-y-2">
          {events.map((event) => (
            <li key={event.id} className="flex items-start justify-between gap-3 rounded-xl bg-muted/60 px-4 py-3">
              <span className="min-w-0 truncate text-sm font-medium">{event.title}</span>
              <span className="shrink-0 text-xs text-muted-foreground">{when(event.starts_at)}</span>
            </li>
          ))}
        </ul>
      )}
    </Panel>
  );
}

export function RemindersPanel({ reminders, now }: { reminders: ReminderRow[] | null; now: string }) {
  if (reminders === null) return null;
  return (
    <Panel>
      <PanelHeader title="Reminders" href="/app/reminders" link="All reminders" />
      {reminders.length === 0 ? (
        <Empty>You are all caught up.</Empty>
      ) : (
        <ul className="mt-4 space-y-2">
          {reminders.map((reminder) => {
            const late = reminder.due_at < now;
            return (
              <li key={reminder.id} className={`flex items-start justify-between gap-3 rounded-xl px-4 py-3 ${late ? "border border-foreground" : "bg-muted/60"}`}>
                <span className="min-w-0 text-sm">{reminder.message}</span>
                <span className={`shrink-0 text-xs ${late ? "font-medium" : "text-muted-foreground"}`}>{late ? "Overdue · " : ""}{when(reminder.due_at)}</span>
              </li>
            );
          })}
        </ul>
      )}
    </Panel>
  );
}

export function InvoicesPanel({ invoices, today }: { invoices: InvoiceRow[] | null; today: string }) {
  if (invoices === null) return null;
  return (
    <Panel>
      <PanelHeader title="Money to chase" href="/app/invoices" link="All invoices" />
      {invoices.length === 0 ? (
        <Empty>No unpaid invoices.</Empty>
      ) : (
        <ul className="mt-4 space-y-2">
          {invoices.map((invoice) => {
            const client = Array.isArray(invoice.clients) ? invoice.clients[0] : invoice.clients;
            const late = invoice.due_on < today;
            return (
              <li key={invoice.id}>
                <Link href={`/app/invoices/${invoice.id}`} prefetch className="flex items-center justify-between gap-3 rounded-xl bg-muted/60 px-4 py-3 transition-colors hover:bg-muted">
                  <span className="min-w-0">
                    <span className="block truncate text-sm font-medium">{client?.name ?? invoice.title}</span>
                    <span className="block text-xs text-muted-foreground">{invoice.number} · {late ? "overdue" : "due"} {invoice.due_on}</span>
                  </span>
                  <span className="shrink-0 text-sm font-semibold">{moneyNode(invoice.balance_cents, invoice.currency)}</span>
                </Link>
              </li>
            );
          })}
        </ul>
      )}
    </Panel>
  );
}
