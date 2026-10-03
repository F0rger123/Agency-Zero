"use client";

import { useEffect, useRef } from "react";

const SNIPPET = `// workflows/client-signed.ts
export async function onClientSigned(contract: Contract) {
  const project = await projects.createFromQuote(contract.quoteId);
  await tasks.seed(project.id, templates.forService(project.service));
  await invoices.scheduleInstallments(contract.quoteId, { deposit: 0.5 });
  await calendar.book("kickoff", { client: contract.clientId, within: "3d" });
  await notify.owner(\`\${contract.client.name} signed — \${project.name} is ready\`);
}

// automations/overdue.ts
export const overdueInvoices = schedule("0 9 * * *", async () => {
  for (const invoice of await invoices.pastDue()) {
    await reminders.send(invoice, { tone: invoice.daysLate > 14 ? "firm" : "friendly" });
    await tasks.create({ title: \`Follow up: \${invoice.number}\`, due: "tomorrow" });
  }
});

// reports/revenue.ts
export function revenue(payments: Payment[]) {
  return payments
    .filter((p) => !p.voidedAt)
    .reduce((total, p) => total + p.amountCents, 0);
}

// pipeline/stages.ts
export const stages = ["lead", "proposal", "active", "retainer"] as const;
export function advance(deal: Deal) {
  const next = stages[stages.indexOf(deal.stage) + 1];
  return next ? { ...deal, stage: next, movedAt: now() } : deal;
}

// intake/webhook.ts
export async function POST(request: Request) {
  const lead = parseLead(await request.json());
  await clients.upsert(lead);
  await tasks.create({ title: \`Reply to \${lead.name}\`, due: "today" });
  return Response.json({ ok: true });
}
`;

/**
 * Monochrome "code environment" behind the software section.
 *
 * Two stacked copies of the same code: a dim one that slowly drifts upward, and
 * a bright one revealed only inside a soft spotlight that follows the pointer.
 * Pure DOM + CSS (no canvas): the only JS is a rAF-throttled pointer handler.
 * Original implementation inspired by interactive code backdrops; the sample
 * code is illustrative (no real client data).
 */
export function CodeField({ className = "" }: { className?: string }) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const node = ref.current;
    if (!node) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    // Pause the drift animation while the section is off-screen.
    const io = new IntersectionObserver(([entry]) => {
      node.dataset.paused = entry.isIntersecting ? "false" : "true";
    });
    io.observe(node);
    let raf = 0;
    let x = 72;
    let y = 40;
    const apply = () => {
      raf = 0;
      node.style.setProperty("--mx", `${x}%`);
      node.style.setProperty("--my", `${y}%`);
    };
    const onMove = (event: PointerEvent) => {
      const rect = node.getBoundingClientRect();
      x = ((event.clientX - rect.left) / rect.width) * 100;
      y = ((event.clientY - rect.top) / rect.height) * 100;
      if (!raf) raf = requestAnimationFrame(apply);
    };
    const parent = node.parentElement ?? node;
    parent.addEventListener("pointermove", onMove, { passive: true });
    return () => {
      parent.removeEventListener("pointermove", onMove);
      io.disconnect();
      if (raf) cancelAnimationFrame(raf);
    };
  }, []);

  const block = (
    <pre className="whitespace-pre px-8 font-mono text-[0.8rem] leading-[1.75] sm:text-[0.9rem]">{SNIPPET}</pre>
  );

  return (
    <div
      ref={ref}
      aria-hidden
      className={`pointer-events-none absolute inset-0 overflow-hidden ${className}`}
      style={{ "--mx": "72%", "--my": "40%" } as React.CSSProperties}
    >
      {/* dim, drifting */}
      <div className="code-drift absolute inset-x-0 top-0 text-bone/[0.17]">
        {block}
        {block}
      </div>
      {/* bright, spotlighted: the mask sits on a STATIC wrapper so it follows the pointer, not the drift */}
      <div
        className="absolute inset-0 hidden [@media(hover:hover)]:block"
        style={{
          maskImage: "radial-gradient(circle 260px at var(--mx) var(--my), #000 0%, transparent 100%)",
          WebkitMaskImage: "radial-gradient(circle 260px at var(--mx) var(--my), #000 0%, transparent 100%)",
        }}
      >
        <div className="code-drift absolute inset-x-0 top-0 text-bone/80">
          {block}
          {block}
        </div>
      </div>
    </div>
  );
}
