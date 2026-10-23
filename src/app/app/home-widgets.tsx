import Link from "next/link";
import { CountUp } from "@/components/money";
import { Icon } from "@/components/icons";
import { homeWidgets, type IconName } from "@/lib/nav";

type Counts = Partial<Record<string, { value: number; label: string }>>;
type Widget = (typeof homeWidgets)[number];

const byHref = (href: string): Widget => homeWidgets.find((widget) => widget.href === href) as Widget;

/** Customers is the hero; the next six share its two rows; the rest are grouped by what they are for. */
const TOP = ["/app/todos", "/app/tasks", "/app/calendar", "/app/projects", "/app/reminders", "/app/leads"];
const GROUPS: { title: string; hrefs: string[]; columns: string }[] = [
  { title: "Meet, sell and get paid", hrefs: ["/app/meetings", "/app/whiteboard", "/app/quotes", "/app/contracts", "/app/invoices", "/app/services"], columns: "lg:grid-cols-3" },
  { title: "Content and growth", hrefs: ["/app/marketing", "/app/social", "/app/shoots", "/app/workload"], columns: "lg:grid-cols-4" },
];

function Tile({ widget, count, index, hero = false }: { widget: Widget; count?: { value: number; label: string }; index: number; hero?: boolean }) {
  return (
    <Link
      href={widget.href}
      prefetch
      style={{ "--i": index } as React.CSSProperties}
      className={`widget-in press group relative flex flex-col justify-between overflow-hidden rounded-2xl border-[1.5px] border-foreground/30 bg-background p-5 transition-[transform,border-color,box-shadow] duration-300 hover:-translate-y-0.5 hover:border-foreground hover:shadow-lg sm:p-6 ${
        hero ? "col-span-2 row-span-2 min-h-56 bg-muted/50" : "min-h-36"
      }`}
    >
      <span className="flex items-start justify-between">
        <span className={`flex items-center justify-center rounded-full border border-border bg-background transition-transform duration-300 group-hover:scale-110 ${hero ? "size-14" : "size-10"}`}>
          <Icon name={widget.icon as IconName} className={hero ? "size-7" : "size-5"} />
        </span>
        {count ? (
          <span className="text-right">
            <span className={`block font-semibold tracking-tight ${hero ? "text-4xl" : "text-2xl"}`}>
              <CountUp value={count.value} />
            </span>
            <span className="block text-[11px] uppercase tracking-widest text-muted-foreground">{count.label}</span>
          </span>
        ) : null}
      </span>
      <span className="mt-6 block">
        <span className={`flex items-center gap-2 font-semibold tracking-tight ${hero ? "text-3xl" : "text-lg"}`}>
          {widget.label}
          <span aria-hidden className="translate-x-0 opacity-0 transition-all duration-300 group-hover:translate-x-1 group-hover:opacity-100">→</span>
        </span>
        <span className={`mt-1 block text-muted-foreground ${hero ? "max-w-xs text-sm" : "text-xs leading-5"}`}>{widget.blurb}</span>
      </span>
    </Link>
  );
}

/**
 * The home screen: big, simple widgets instead of a sidebar. Customers leads (everything lives inside a customer),
 * then the cross-cutting views in tidy groups. A widget with a live number counts it up when the page opens or is clicked.
 */
export function HomeWidgets({ counts }: { counts: Counts }) {
  let index = 0;
  return (
    <div className="space-y-10">
      <section aria-label="Everyday" className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-5">
        <Tile widget={byHref("/app/clients")} count={counts["/app/clients"]} index={index++} hero />
        {TOP.map((href) => (
          <Tile key={href} widget={byHref(href)} count={counts[href]} index={index++} />
        ))}
      </section>
      {GROUPS.map((group) => (
        <section key={group.title} aria-label={group.title}>
          <h2 className="mb-3 text-xs font-medium uppercase tracking-widest text-muted-foreground">{group.title}</h2>
          <div className={`grid grid-cols-2 gap-3 sm:gap-4 [&>:last-child:nth-child(odd)]:col-span-2 lg:[&>:last-child:nth-child(odd)]:col-span-1 ${group.columns}`}>
            {group.hrefs.map((href) => (
              <Tile key={href} widget={byHref(href)} count={counts[href]} index={index++} />
            ))}
          </div>
        </section>
      ))}
    </div>
  );
}
