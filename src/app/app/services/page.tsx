import { AddDialog, LinkDialog } from "@/components/modal";
import { groupServices } from "@/lib/service-presets";
import type { Metadata } from "next";
import { createClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { isMissingTable } from "@/lib/forms";
import { billingIntervalLabel, hoursLabel } from "@/lib/format";
import { moneyNode } from "@/components/money-node";
import { PICKER_LIMIT } from "@/lib/limits";
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
  const [directoryResponse, clientsResponse, categoriesResponse] = await Promise.all([
    supabase.rpc("get_service_directory"),
    supabase.from("clients").select("id, name").is("deleted_at", null).order("name").limit(PICKER_LIMIT),
    // Categories arrive with migration 0030; on a database that is behind this errors and everything shows under "Other".
    supabase.from("services").select("id, category").limit(500),
  ]);

  const header = (
    <PageHeader
      title="Services"
      description="What you sell, grouped by category. Each service sets the default price and billing for quotes and assignments."
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

  const categoryById = new Map(
    (categoriesResponse.error ? [] : ((categoriesResponse.data ?? []) as { id: string; category: string | null }[])).map((row) => [row.id, row.category]),
  );
  const services = ((directoryResponse.data ?? []) as DirectoryService[]).map((service) => ({
    ...service,
    category: categoryById.get(service.id) ?? null,
  }));
  const clients = (clientsResponse.data ?? []) as { id: string; name: string }[];
  const activeServices = services.filter((service) => service.active);
  const totalMrr = services.reduce((sum, service) => sum + service.mrr_cents, 0);

  return (
    <>
      {header}

      <div className="-mt-4 mb-8 flex flex-wrap gap-3">
        <AddDialog label="New service" title="New service" description="Step by step: pick a starting point, then set the price.">
          <NewServiceForm />
        </AddDialog>
        <AddDialog label="Assign to client" title="Assign a service to a client" variant="outline">
          <AssignServiceForm clients={clients} services={activeServices} />
        </AddDialog>
      </div>

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
          <p className="mt-1 text-[11px] uppercase tracking-widest text-muted-foreground">Recurring assignments</p>
        </div>
        <div className="bg-background p-5">
          <p className="text-2xl font-semibold tracking-tight">{moneyNode(totalMrr)}</p>
          <p className="mt-1 text-[11px] uppercase tracking-widest text-muted-foreground">Catalogue MRR</p>
        </div>
      </div>

      <section aria-labelledby="service-list-heading" className="mt-12">
        <h2 id="service-list-heading" className="sr-only">
          Catalogue
        </h2>
        {services.length === 0 ? (
          <p className="border-t border-border py-8 text-sm text-muted-foreground">
            No services yet. Use New service above; it walks you through it.
          </p>
        ) : (
          <div className="space-y-10">
            {groupServices(services).map((group) => (
              <div key={group.title}>
                <h3 className="text-xs font-medium uppercase tracking-widest text-muted-foreground">
                  {group.title} <span className="text-faint-foreground">{group.items.length}</span>
                </h3>
                <ul className="mt-3 divide-y divide-border border-y border-border">
                  {group.items.map((service) => (
                    <li key={service.id} className="flex flex-wrap items-center justify-between gap-x-6 gap-y-3 py-4">
                      <div className="min-w-0 grow basis-64">
                        <p className="font-medium">
                          {service.name}
                          {service.active ? null : (
                            <span className="ml-2 rounded-full border border-border px-2 py-0.5 text-[11px] font-medium uppercase tracking-widest text-muted-foreground">
                              Inactive
                            </span>
                          )}
                        </p>
                        {service.description ? (
                          <p className="mt-1 line-clamp-2 max-w-prose text-sm text-muted-foreground">{service.description}</p>
                        ) : null}
                      </div>
                      <div className="text-sm">
                        <p className="font-medium">
                          {service.default_price_cents != null ? moneyNode(service.default_price_cents) : "No price set"}
                          {service.default_billing === "recurring" ? (
                            <span className="ml-1 font-normal text-muted-foreground">{billingIntervalLabel(service.billing_interval)}</span>
                          ) : null}
                        </p>
                        <p className="mt-1 text-xs text-muted-foreground">
                          {service.default_billing === "recurring" ? "Recurring" : "One-time"}
                          {service.default_estimated_minutes != null ? ` · ${hoursLabel(service.default_estimated_minutes)}` : ""}
                          {` · ${service.assigned_clients} ${service.assigned_clients === 1 ? "client" : "clients"}`}
                        </p>
                      </div>
                      <div className="flex items-center gap-4">
                        <LinkDialog label="Edit" title={`Edit ${service.name}`} className="text-xs text-foreground">
                          <EditServiceForm service={service} />
                        </LinkDialog>
                        <SetServiceActiveForm serviceId={service.id} active={service.active} />
                      </div>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        )}
      </section>

      <p className="mt-10 border-t border-border pt-6 text-xs text-muted-foreground">
        Services assigned to a client appear on the client workspace Services tab; recurring assignments feed the
        dashboard MRR/ARR card. Quote lines can be built from this catalogue in the quote editor.
      </p>
    </>
  );
}
