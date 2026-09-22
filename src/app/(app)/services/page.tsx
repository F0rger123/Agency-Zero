import type { Metadata } from "next";
import { createClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { isMissingTable } from "@/lib/forms";
import { billingIntervalLabel, hoursLabel, moneyLabel } from "@/lib/format";
import { PageHeader } from "@/components/page-header";
import { DataFailure, MigrationsRequired, SetupRequired } from "@/components/states";
import {
  AssignServiceForm,
  EditServiceForm,
  NewServiceForm,
  SetServiceActiveForm,
  type ServiceRow,
} from "./service-forms";

export const metadata: Metadata = { title: "Services" };

type DirectoryService = ServiceRow & {
  assigned_clients: number;
  recurring_clients: number;
  one_off_clients: number;
  mrr_cents: number;
};

/**
 * Services (/services) — the custom service catalogue.
 *
 * Create, edit, and deactivate services with a default price, billing model
 * (one-time vs recurring), billing interval (monthly / quarterly / yearly),
 * and default estimated time; assign them to clients; and use them to build
 * quote lines (the quote editor's service picker reads the same catalogue).
 *
 * One read: `get_service_directory()` (migration 0010) returns every service
 * with its assignment counts and normalized MRR.
 */
export default async function ServicesPage() {
  if (!isSupabaseConfigured()) return <SetupRequired />;

  const supabase = await createClient();
  const [directoryResponse, clientsResponse] = await Promise.all([
    supabase.rpc("get_service_directory"),
    supabase.from("clients").select("id, name").is("deleted_at", null).order("name"),
  ]);

  const header = (
    <PageHeader
      title="Services"
      description="The catalogue behind assignments, quotes, and recurring revenue: default price, one-time or recurring billing, interval, and default estimated time."
    />
  );

  const failure = directoryResponse.error ?? clientsResponse.error;
  if (failure) {
    if (isMissingTable(failure.message)) {
      return (
        <>
          {header}
          <MigrationsRequired detail={failure.message} />
        </>
      );
    }
    return (
      <>
        {header}
        <DataFailure
          title="Service catalogue"
          message={failure.message}
          hint="The catalogue is read with public.get_service_directory() (migration 0010). The exact error is below."
        />
      </>
    );
  }

  const services = (directoryResponse.data ?? []) as DirectoryService[];
  const clients = (clientsResponse.data ?? []) as { id: string; name: string }[];
  const activeServices = services.filter((service) => service.active);
  const totalMrr = services.reduce((sum, service) => sum + service.mrr_cents, 0);

  return (
    <>
      {header}

      <div className="grid grid-cols-2 gap-px border border-border bg-border sm:grid-cols-4">
        <div className="bg-background p-5">
          <p className="text-2xl font-semibold tracking-tight">{services.length}</p>
          <p className="mt-1 text-[11px] uppercase tracking-widest text-muted-foreground">Services</p>
        </div>
        <div className="bg-background p-5">
          <p className="text-2xl font-semibold tracking-tight">{activeServices.length}</p>
          <p className="mt-1 text-[11px] uppercase tracking-widest text-muted-foreground">Active</p>
        </div>
        <div className="bg-background p-5">
          <p className="text-2xl font-semibold tracking-tight">
            {services.reduce((sum, service) => sum + service.recurring_clients, 0)}
          </p>
          <p className="mt-1 text-[11px] uppercase tracking-widest text-muted-foreground">
            Recurring assignments
          </p>
        </div>
        <div className="bg-background p-5">
          <p className="text-2xl font-semibold tracking-tight">{moneyLabel(totalMrr)}</p>
          <p className="mt-1 text-[11px] uppercase tracking-widest text-muted-foreground">
            Catalogue MRR
          </p>
        </div>
      </div>

      <section aria-labelledby="service-list-heading" className="mt-12">
        <h2
          id="service-list-heading"
          className="text-xs font-medium uppercase tracking-widest text-muted-foreground"
        >
          Catalogue
        </h2>
        {services.length === 0 ? (
          <p className="mt-4 border-t border-border py-8 text-sm text-muted-foreground">
            No services yet. Add the first one below — services populate the
            assignment and quote line pickers.
          </p>
        ) : (
          <div className="mt-4 space-y-10">
            {services.map((service) => (
              <div key={service.id} className="border-t border-border pt-6">
                <div className="flex flex-wrap items-start justify-between gap-4">
                  <div>
                    <h3 className="text-base font-medium">
                      {service.name}
                      {service.active ? null : (
                        <span className="ml-2 rounded-full border border-border px-2 py-0.5 text-[11px] font-medium uppercase tracking-widest text-muted-foreground">
                          Inactive
                        </span>
                      )}
                    </h3>
                    <p className="mt-1 max-w-prose text-sm text-muted-foreground">
                      {service.description || "No description yet."}
                    </p>
                  </div>
                  <SetServiceActiveForm serviceId={service.id} active={service.active} />
                </div>

                <dl className="mt-4 grid gap-px border border-border bg-border sm:grid-cols-4">
                  <div className="bg-background p-4">
                    <dt className="text-[11px] uppercase tracking-widest text-muted-foreground">
                      Billing
                    </dt>
                    <dd className="mt-1 text-sm font-medium">
                      {service.default_billing === "recurring"
                        ? `Recurring · ${billingIntervalLabel(service.billing_interval)}`
                        : "One-time"}
                    </dd>
                  </div>
                  <div className="bg-background p-4">
                    <dt className="text-[11px] uppercase tracking-widest text-muted-foreground">
                      Default price
                    </dt>
                    <dd className="mt-1 text-sm font-medium">
                      {moneyLabel(service.default_price_cents)}
                    </dd>
                  </div>
                  <div className="bg-background p-4">
                    <dt className="text-[11px] uppercase tracking-widest text-muted-foreground">
                      Default estimate
                    </dt>
                    <dd className="mt-1 text-sm font-medium">
                      {hoursLabel(service.default_estimated_minutes)}
                    </dd>
                  </div>
                  <div className="bg-background p-4">
                    <dt className="text-[11px] uppercase tracking-widest text-muted-foreground">
                      Clients / MRR
                    </dt>
                    <dd className="mt-1 text-sm font-medium">
                      {service.assigned_clients} assigned
                      <span className="ml-1 text-muted-foreground">
                        · {moneyLabel(service.mrr_cents)}/mo
                      </span>
                    </dd>
                  </div>
                </dl>

                <div className="mt-6">
                  <EditServiceForm service={service} />
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      <div className="mt-14 space-y-10">
        <NewServiceForm />
        <AssignServiceForm clients={clients} services={activeServices} />
      </div>

      <p className="mt-10 border-t border-border pt-6 text-xs text-muted-foreground">
        Services assigned to a client appear on the client workspace Services
        tab; recurring assignments feed the dashboard MRR/ARR card. Quote lines
        can be built from this catalogue in the quote editor.
      </p>
    </>
  );
}
