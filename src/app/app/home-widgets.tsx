import Link from "next/link";
import { CountUp } from "@/components/money";
import { Icon } from "@/components/icons";
import { homeWidgets, type IconName } from "@/lib/nav";
import { LockInWidget } from "./lock-in/lock-in";
import { QuickNote } from "./quick-note/quick-note";

type Counts = Partial<Record<string, { value: number; label: string }>>;

/**
 * The home screen: big, simple widgets instead of a sidebar. Customers leads (everything lives inside a customer),
 * then the cross-cutting views. A widget with a live number counts it up when the page opens or the number is clicked.
 */
export function HomeWidgets({ counts }: { counts: Counts }) {
  return (
    <section aria-label="Sections" className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
      <div className="widget-in col-span-2" style={{ "--i": 0 } as React.CSSProperties}>
        <LockInWidget />
      </div>
      <div className="widget-in col-span-2" style={{ "--i": 1 } as React.CSSProperties}>
        <QuickNote variant="widget" />
      </div>
      {homeWidgets.map((widget, index) => {
        const count = counts[widget.href];
        const hero = widget.href === "/app/clients";
        return (
          <Link
            key={widget.href}
            href={widget.href}
            prefetch
            style={{ "--i": index + 2 } as React.CSSProperties}
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
      })}
    </section>
  );
}
