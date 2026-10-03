/**
 * Illustrative CRM interface — built in HTML/CSS so it stays crisp and carries
 * no fabricated numbers. Replace with real product screenshots when available
 * (see docs/development/SITE_CONTENT.md).
 */
const columns = [
  { name: "Lead", cards: ["Client name", "Client name"] },
  { name: "Proposal", cards: ["Client name"] },
  { name: "Active", cards: ["Client name", "Client name", "Client name"] },
  { name: "Retainer", cards: ["Client name", "Client name"] },
];

const flow = ["Contract signed", "Project created", "Deposit scheduled", "Kickoff booked"];

export function CrmMockup() {
  return (
    <div
      role="img"
      aria-label="Illustration of a custom CRM: sidebar navigation, a sales pipeline board and an automation flow"
      className="relative overflow-hidden border border-rule-strong bg-coal/90 shadow-[0_40px_120px_-30px_rgba(0,0,0,0.9)] backdrop-blur-sm"
    >
      {/* window chrome */}
      <div className="flex items-center gap-2 border-b border-rule px-4 py-3">
        <span className="size-2 rounded-full border border-rule-strong" />
        <span className="size-2 rounded-full border border-rule-strong" />
        <span className="size-2 rounded-full border border-rule-strong" />
        <span className="t-label ml-4">your-business / crm</span>
      </div>

      <div className="grid grid-cols-[110px_1fr] sm:grid-cols-[150px_1fr]">
        <div className="space-y-2 border-r border-rule p-4">
          {["Overview", "Clients", "Pipeline", "Projects", "Invoices", "Reports"].map((item, i) => (
            <div
              key={item}
              className={`font-mono text-[0.65rem] uppercase tracking-[0.14em] ${
                i === 2 ? "text-bone" : "text-ash"
              }`}
            >
              {i === 2 ? "▸ " : "  "}
              {item}
            </div>
          ))}
        </div>

        <div className="p-4 sm:p-5">
          <div className="flex items-baseline justify-between">
            <p className="text-sm font-medium">Pipeline</p>
            <p className="t-label">Illustrative</p>
          </div>

          <div className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-4">
            {columns.map((column) => (
              <div key={column.name} className="space-y-2">
                <p className="t-label !tracking-[0.12em]">{column.name}</p>
                {column.cards.map((card, i) => (
                  <div key={i} className="border border-rule p-2.5">
                    <div className="h-1.5 w-3/4 bg-bone/70" />
                    <div className="mt-2 h-1 w-1/2 bg-bone/20" />
                  </div>
                ))}
              </div>
            ))}
          </div>

          <div className="mt-6 border-t border-rule pt-4">
            <p className="t-label mb-3">Automation</p>
            <ol className="flex flex-wrap items-center gap-x-2 gap-y-2 font-mono text-[0.65rem] uppercase tracking-[0.1em]">
              {flow.map((step, i) => (
                <li key={step} className="flex items-center gap-2">
                  <span className="border border-rule-strong px-2 py-1 text-mist">{step}</span>
                  {i < flow.length - 1 ? <span className="text-ash">→</span> : null}
                </li>
              ))}
            </ol>
          </div>
        </div>
      </div>
    </div>
  );
}
