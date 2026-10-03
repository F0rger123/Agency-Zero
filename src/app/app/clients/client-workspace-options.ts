import type { ClientWorkspaceData } from "./client-workspace-types";

/** Option lists for the "create inside this client" forms, built from the workspace payload. */
export function clientFormOptions(data: ClientWorkspaceData) {
  const { client } = data;
  return {
    clients: [{ id: client.id, label: `${client.name}${client.company ? ` · ${client.company}` : ""}` }],
    projects: data.projects.map((project) => ({ id: project.id, label: project.name })),
    quotes: data.quotes.map((quote) => ({ id: quote.id, label: `${quote.number} · ${quote.title}` })),
    contracts: data.contracts.map((contract) => ({ id: contract.id, label: contract.title })),
    services: data.service_catalog.map((service) => ({
      id: service.id,
      name: service.name,
      default_billing: service.default_billing,
      default_price_cents: service.default_price_cents ?? null,
      billing_interval: service.billing_interval ?? "month",
    })),
  };
}
