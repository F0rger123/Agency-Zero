/**
 * Contract library: a set of work types, each assembled from shared plain-English clauses, so every contract covers the
 * basics for both sides (scope, payment, ownership, confidentiality, liability, ending the deal, disputes) and adds what
 * is specific to the kind of work (acceptance for builds, no-guarantee language for marketing, usage rights for video...).
 *
 * `buildContractBody` fills every blank it can from what the CRM knows about the customer and the deal.
 * These are general-purpose starting points, not legal advice: the UI tells the owner to have a lawyer review them.
 */

export type WorkTypeKey = "software" | "website" | "retainer" | "seo" | "ads" | "content" | "care" | "branding" | "consulting" | "general" | "nda";

export type FeeKind = "project" | "monthly" | "hourly" | "none";

export type WorkType = {
  key: WorkTypeKey;
  name: string;
  /** One line on the card. */
  summary: string;
  fee: FeeKind;
  recurring: boolean;
  /** Months of minimum commitment for recurring work (1 means month-to-month). */
  defaultTermMonths: number;
  defaultScope: string;
  /** Plain headings of what the contract covers, shown in the library. */
  covers: string[];
};

export type ContractVars = {
  businessName: string;
  businessEmail: string;
  clientName: string;
  clientCompany: string;
  clientEmail: string;
  clientPhone: string;
  clientWebsite: string;
  /** Already formatted, e.g. "October 23, 2026". */
  date: string;
  scope: string;
  /** Fee block, already written out (see `feeBlock`). */
  fees: string;
  paymentDays: number;
  noticeDays: number;
  termMonths: number;
  revisionRounds: number;
  warrantyDays: number;
  state: string;
};

export const WORK_TYPES: WorkType[] = [
  {
    key: "software",
    name: "Software or CRM build",
    summary: "A custom app, CRM or integration built to a defined scope.",
    fee: "project",
    recurring: false,
    defaultTermMonths: 1,
    defaultScope: "Design, development, testing and launch of custom software as described here: [what it does, who uses it, and the main features].",
    covers: ["Scope and change orders", "Milestones, acceptance and revisions", "Deposit and payment", "Ownership of the code", "Third-party and open-source parts", "Data, privacy and security", "Warranty and support window", "Liability, termination, disputes"],
  },
  {
    key: "website",
    name: "Website design and build",
    summary: "A new website or redesign, from design to launch.",
    fee: "project",
    recurring: false,
    defaultTermMonths: 1,
    defaultScope: "Design, build and launch of a website: [number of pages, main features, and any integrations such as forms, booking or online sales].",
    covers: ["Scope and change orders", "Design approval and revision rounds", "Content and asset delivery", "Deposit and payment", "Ownership once paid", "Hosting, domains and third-party costs", "Warranty window", "Liability, termination, disputes"],
  },
  {
    key: "retainer",
    name: "Monthly recurring work",
    summary: "An ongoing monthly engagement with a fixed monthly fee.",
    fee: "monthly",
    recurring: true,
    defaultTermMonths: 3,
    defaultScope: "Ongoing monthly services: [what is included each month, and how many hours or deliverables].",
    covers: ["Monthly scope and what is not included", "Term, renewal and cancelling", "Monthly invoicing and late payment", "Access to accounts", "Reporting", "No guarantee of results", "Price changes", "Liability, termination, disputes"],
  },
  {
    key: "seo",
    name: "SEO monthly retainer",
    summary: "Monthly search optimisation with honest, no-guarantee language.",
    fee: "monthly",
    recurring: true,
    defaultTermMonths: 6,
    defaultScope: "Monthly search engine optimisation for the Client's website: [keyword research, on-page fixes, content, local listings, and monthly reporting].",
    covers: ["Monthly SEO scope", "No ranking guarantees", "Website and account access", "Content approval", "Minimum term and cancelling", "Reporting", "Liability, termination, disputes"],
  },
  {
    key: "ads",
    name: "Paid ads management (Meta, Google)",
    summary: "Running ad campaigns. Ad spend is paid separately by the customer.",
    fee: "monthly",
    recurring: true,
    defaultTermMonths: 3,
    defaultScope: "Setup and monthly management of paid advertising on [Meta (Facebook and Instagram), Google, or other platforms], including audiences, creative, tracking and reporting.",
    covers: ["Management scope", "Ad spend paid by the Client, separate from fees", "Client owns the ad accounts", "Platform rules and approvals", "No guarantee of results", "Minimum term and cancelling", "Liability, termination, disputes"],
  },
  {
    key: "content",
    name: "Social media and video content",
    summary: "Social management and/or shoot days, with usage rights and releases.",
    fee: "monthly",
    recurring: true,
    defaultTermMonths: 3,
    defaultScope: "Social media content services: [posts per month, short videos per month, shoot days, platforms, and community management if included].",
    covers: ["Content scope and schedule", "Shoots: rescheduling and cancellation", "Releases and permissions", "Approval and revisions", "Ownership and usage licence", "Platform rules and music", "No guarantee of reach", "Liability, termination, disputes"],
  },
  {
    key: "care",
    name: "Website or software care plan",
    summary: "Monthly hosting, updates, backups and small fixes.",
    fee: "monthly",
    recurring: true,
    defaultTermMonths: 1,
    defaultScope: "Monthly care of the Client's [website or software]: hosting, updates, backups, security patches, uptime checks and [number] hours of small changes.",
    covers: ["What the plan includes and excludes", "Hours and requests", "Hosting and third-party costs", "Backups and security (best effort)", "Month-to-month cancelling", "Liability, termination, disputes"],
  },
  {
    key: "branding",
    name: "Branding and design",
    summary: "Logo, brand identity or other design work with revision rounds.",
    fee: "project",
    recurring: false,
    defaultTermMonths: 1,
    defaultScope: "Brand and design work: [logo, colours, typography, brand guide, and any other deliverables].",
    covers: ["Deliverables and revisions", "Deposit and payment", "Ownership once paid", "Fonts, stock and third-party assets", "Portfolio use", "Liability, termination, disputes"],
  },
  {
    key: "consulting",
    name: "Consulting or hourly work",
    summary: "Advice or hands-on help billed by the hour.",
    fee: "hourly",
    recurring: false,
    defaultTermMonths: 1,
    defaultScope: "Consulting and hands-on help on: [topic or goals], billed by the hour.",
    covers: ["Hourly rate and time tracking", "Estimates are not caps", "Invoicing", "Advice is not a guarantee", "Liability, termination, disputes"],
  },
  {
    key: "general",
    name: "Other work (describe it)",
    summary: "Anything else. You describe the work; the protections stay.",
    fee: "project",
    recurring: false,
    defaultTermMonths: 1,
    defaultScope: "[Describe the work, the deliverables and anything that is not included.]",
    covers: ["Scope and change orders", "Deposit and payment", "Ownership once paid", "Confidentiality", "Liability, termination, disputes"],
  },
  {
    key: "nda",
    name: "Mutual confidentiality agreement (NDA)",
    summary: "Both sides keep each other's information private.",
    fee: "none",
    recurring: false,
    defaultTermMonths: 1,
    defaultScope: "Discussing and possibly working together on: [the project or opportunity].",
    covers: ["What counts as confidential", "What each side must do", "Exceptions", "How long it lasts", "Returning information", "Disputes"],
  },
];

export const workType = (key: WorkTypeKey): WorkType => WORK_TYPES.find((type) => type.key === key) ?? WORK_TYPES[0];

/* ── Money helpers ─────────────────────────────────────────────────────────────────────────── */

const usd = (cents: number) => new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(cents / 100);

export type FeeInput = {
  /** One-time total for a project, in cents. */
  projectCents?: number;
  /** Deposit percent due on signing (0–100). */
  depositPercent?: number;
  monthlyCents?: number;
  /** One-time setup fee on top of a monthly fee, in cents. */
  setupCents?: number;
  hourlyCents?: number;
};

const PERIOD_WORDS: Record<string, string> = { month: "per month", quarter: "per quarter", year: "per year" };

export type QuoteFeeLine = { description: string; amount_cents: number; selection: string; is_recurring: boolean; billing_period: string | null };

/** The fee block from a quote's included items (optional extras are left out; they are not agreed yet). */
export function feeBlockFromQuote(lines: QuoteFeeLine[], paymentDays: number, depositPercent = 0): string {
  const included = lines.filter((line) => line.selection === "fixed");
  if (included.length === 0) return "Fees are as agreed in writing between the parties.";
  const rows = included.map((line) => `  - ${line.description}: ${usd(line.amount_cents)}${line.is_recurring ? ` ${PERIOD_WORDS[line.billing_period ?? "month"] ?? "per month"}` : " (one-time)"}`);
  const oneTime = included.filter((line) => !line.is_recurring).reduce((sum, line) => sum + line.amount_cents, 0);
  const parts = [`The fees are:\n${rows.join("\n")}`];
  if (oneTime > 0 && depositPercent > 0) {
    parts.push(`A deposit of ${depositPercent}% of the one-time fees (${usd(Math.round((oneTime * depositPercent) / 100))}) is due when this agreement is signed, and work begins once it is paid. The remaining one-time fees are due within ${paymentDays} days of delivery.`);
  } else if (oneTime > 0) {
    parts.push(`One-time fees are due within ${paymentDays} days of the invoice date.`);
  }
  if (included.some((line) => line.is_recurring)) parts.push("Recurring fees are invoiced in advance for each billing period, starting when this agreement is signed.");
  return parts.join("\n\n");
}

/** The fee block from typed-in amounts. */
export function feeBlock(kind: FeeKind, input: FeeInput, paymentDays: number): string {
  if (kind === "none") return "No fees are payable under this agreement.";
  if (kind === "hourly") {
    return input.hourlyCents
      ? `The Agency's rate is ${usd(input.hourlyCents)} per hour, billed in 15-minute increments and invoiced monthly in arrears. Invoices are due within ${paymentDays} days.`
      : "The Agency's hourly rate is as agreed in writing between the parties. Time is billed in 15-minute increments and invoiced monthly in arrears.";
  }
  if (kind === "monthly") {
    const lines = [input.monthlyCents ? `The monthly fee is ${usd(input.monthlyCents)}, invoiced in advance on the first day of each month (the first invoice is issued when this agreement is signed) and due within ${paymentDays} days.` : "The monthly fee is as agreed in writing between the parties, invoiced in advance for each month."];
    if (input.setupCents) lines.push(`A one-time setup fee of ${usd(input.setupCents)} is due when this agreement is signed.`);
    return lines.join("\n\n");
  }
  if (!input.projectCents) return "The project fee is as agreed in writing between the parties.";
  const deposit = Math.min(100, Math.max(0, input.depositPercent ?? 0));
  const base = `The total project fee is ${usd(input.projectCents)}.`;
  if (deposit > 0 && deposit < 100) {
    const depositCents = Math.round((input.projectCents * deposit) / 100);
    return `${base} A deposit of ${deposit}% (${usd(depositCents)}) is due when this agreement is signed, and work begins once it is paid. The balance of ${usd(input.projectCents - depositCents)} is due within ${paymentDays} days of delivery.`;
  }
  if (deposit >= 100) return `${base} The full amount is due when this agreement is signed, and work begins once it is paid.`;
  return `${base} It is due within ${paymentDays} days of delivery.`;
}

/* ── Clauses ───────────────────────────────────────────────────────────────────────────────── */

type Section = { heading: string; body: string };
const party = (vars: ContractVars) => (vars.clientCompany ? `${vars.clientCompany} (represented by ${vars.clientName})` : vars.clientName);

const clauses = {
  scope: (vars: ContractVars, extra = ""): Section => ({
    heading: "Scope of work",
    body: `The Agency will provide the following to the Client:\n\n${vars.scope.trim() || "[Describe the work.]"}\n\n${extra}Anything not described here is outside this agreement. If the Client asks for something outside it, the Agency will explain the effect on cost and timing, and the work only goes ahead once both parties agree to the change in writing (an email is enough).`.trim(),
  }),
  fees: (vars: ContractVars, tail = ""): Section => ({
    heading: "Fees and payment",
    body: `${vars.fees.trim()}\n\nFees do not include sales tax, if any applies, or third-party costs such as domains, hosting, software licences, stock media or ad spend, which the Client pays or reimburses at cost. Any invoice not paid within ${vars.paymentDays} days of its due date may carry a late fee of 1.5% per month (or the highest rate the law allows, if lower), and the Agency may pause work until the account is current. ${tail}`.trim(),
  }),
  clientDuties: (): Section => ({
    heading: "What the Client provides",
    body: "The Client will give the Agency, on time, the information, materials, access, feedback and approvals it reasonably needs, and will name one person who can make decisions. If the Client is late, deadlines move by the same amount of time, and the Agency is not responsible for delays this causes. The Client confirms it has the right to give the Agency any text, images, logos, music, data or other materials it supplies.",
  }),
  acceptance: (vars: ContractVars): Section => ({
    heading: "Review, revisions and acceptance",
    body: `The Agency will deliver the work for review. The price includes up to ${vars.revisionRounds} rounds of revisions to the agreed scope; further revisions or new ideas are billed at the Agency's then-current hourly rate or handled as a change. The Client will review and respond within 7 days of delivery. If the Client does not respond within 14 days, or uses the work live, it is treated as accepted.`,
  }),
  ipProject: (): Section => ({
    heading: "Ownership",
    body: "When the Client has paid in full, the Agency assigns to the Client its rights in the final deliverables created specifically for the Client under this agreement. Until then the Agency keeps ownership and the Client may use them only for evaluation. The Agency keeps ownership of its pre-existing tools, code libraries, templates, know-how and general methods (\"Agency Materials\"), and gives the Client a non-exclusive, perpetual licence to use any Agency Materials built into the deliverables as part of them. Third-party and open-source components stay under their own licences, which the Agency will point out where they matter. The Agency may show the finished work in its portfolio and case studies unless the Client asks in writing that it not do so.",
  }),
  ipContent: (): Section => ({
    heading: "Ownership and usage rights",
    body: "When the Client has paid in full, the Client receives a perpetual, worldwide licence to use the final edited content delivered under this agreement for its own business, including on its website, social media and advertising. The Agency keeps ownership of raw footage, project files, drafts, presets, templates and methods, and does not have to deliver them unless this agreement says so. The Agency may show the finished work in its portfolio and on its own channels. The Client is responsible for the licences to any music, fonts, logos or images the Client asks to be used, and for permission to film at its locations and to feature its staff, customers and others (including signed releases where needed).",
  }),
  confidentiality: (): Section => ({
    heading: "Confidentiality",
    body: "Each party will keep the other's non-public business information (such as pricing, customer lists, plans, passwords and unpublished work) confidential, use it only for this agreement, and share it only with people who need it to do the work and are bound to keep it private. This does not cover information that is public through no fault of the receiving party, that it already had or learned lawfully from someone else, or that it must disclose by law. This section continues for 3 years after the agreement ends, and for as long as trade secrets remain secret.",
  }),
  data: (): Section => ({
    heading: "Data, privacy and security",
    body: "The Client owns its data and content. The Agency will use them only to provide the services, will keep them secure using reasonable measures, and will tell the Client without unreasonable delay if it learns of unauthorised access to them. Each party will follow the privacy and data-protection laws that apply to it. The Client is responsible for the lawfulness of the data it provides and for its own privacy notices and consents. No system can be made completely secure, and the Agency does not promise that it will be.",
  }),
  warranty: (vars: ContractVars): Section => ({
    heading: "Warranty and disclaimer",
    body: `For ${vars.warrantyDays} days after delivery the Agency will fix, at no extra charge, any defect where the work does not do what this agreement describes, provided the Client reports it in writing and has not changed the work or its environment in a way that caused it. This is the Client's only remedy for defects. Apart from this, the work is provided "as is", and neither party gives any other warranty, express or implied, including about fitness for a particular purpose. The Agency does not promise that the work will be uninterrupted or error-free, or that it will produce any particular business result.`,
  }),
  noGuarantee: (what: string): Section => ({
    heading: "No guarantee of results",
    body: `${what} depend on many things outside the Agency's control, including competitors, platform and search-engine changes, the market, the Client's offer and the Client's own follow-up. The Agency will use professional skill and care, but does not promise any particular ranking, traffic, leads, sales, reach or return on spend.`,
  }),
  liability: (): Section => ({
    heading: "Limits on liability",
    body: "Neither party is liable to the other for indirect, incidental, special, consequential or punitive damages, or for lost profits, lost revenue or lost data, even if told they might happen. Each party's total liability under this agreement is limited to the fees the Client paid or owed to the Agency in the 12 months before the claim. These limits do not apply to the Client's duty to pay fees, to a party's breach of confidentiality or intentional wrongdoing, or to anything the law does not allow to be limited.",
  }),
  indemnity: (): Section => ({
    heading: "Protecting each other",
    body: "The Client will defend and cover the Agency against claims by third parties that the materials, instructions or data the Client supplied infringe someone's rights or break the law. The Agency will defend and cover the Client against claims by third parties that the deliverables the Agency created (not including anything the Client supplied or changed) infringe someone's intellectual property rights. The party seeking cover must tell the other promptly, let it control the defence, and cooperate reasonably.",
  }),
  termProject: (vars: ContractVars): Section => ({
    heading: "Ending this agreement",
    body: `Either party may end this agreement with ${vars.noticeDays} days' written notice, or immediately if the other party seriously breaches it and does not fix the problem within 10 days of written notice. On ending, the Client pays for all work done and costs committed up to the end date, and the Agency delivers the work completed so far once it is paid for. Sections about payment, ownership, confidentiality, liability and disputes continue after this agreement ends.`,
  }),
  termRecurring: (vars: ContractVars): Section => ({
    heading: "Term, renewal and cancelling",
    body: `${vars.termMonths > 1 ? `This agreement starts on the date it is signed and runs for an initial term of ${vars.termMonths} months. After that it renews automatically month to month until ended.` : "This agreement starts on the date it is signed and renews automatically month to month until ended."} ${vars.termMonths > 1 ? `Neither party may end it during the initial term except for serious breach that is not fixed within 10 days of written notice. ` : ""}After the initial term, either party may end it with ${vars.noticeDays} days' written notice, effective at the end of the billing period that notice falls in. The Agency may change its monthly fee on ${vars.noticeDays} days' written notice; if the Client does not agree, it may end the agreement before the new fee starts. Fees already paid for a period in progress are not refunded, and the Client pays for all work done up to the end date. Sections about payment, ownership, confidentiality, liability and disputes continue after this agreement ends.`,
  }),
  access: (): Section => ({
    heading: "Access to accounts",
    body: "The Client will give the Agency the access it needs (for example to its website, analytics, ad accounts and social profiles) and will keep ownership of those accounts, with the Agency added as an administrator or partner wherever the platform allows. The Agency will keep log-in details secure and use them only for this work. When the agreement ends, the Agency will remove its own access and, on request, hand over any account details it created on the Client's behalf.",
  }),
  reporting: (): Section => ({
    heading: "Reporting and communication",
    body: "The Agency will send the Client a summary of work done and results each month, and will reply to messages within 2 business days. Calls and meetings are by appointment during normal business hours.",
  }),
  contractor: (): Section => ({
    heading: "Independent contractor",
    body: "The Agency is an independent contractor, not an employee, partner or agent of the Client. The Agency decides how, when and where the work is done, uses its own tools, and is responsible for its own taxes and insurance. Neither party may make commitments on the other's behalf.",
  }),
  nonSolicit: (): Section => ({
    heading: "Staff and subcontractors",
    body: "During this agreement and for 12 months after, neither party will directly recruit the other's employees or subcontractors who worked on this engagement, other than through general public job advertisements. The Agency may use subcontractors and remains responsible for their work and for keeping this agreement's confidentiality duties.",
  }),
  disputes: (vars: ContractVars): Section => ({
    heading: "If we disagree",
    body: `The parties will first try to settle any dispute by talking in good faith for 30 days after one of them gives written notice of it. If that fails, they will try mediation before starting a court case, except where a party needs urgent court action to protect its rights. This agreement is governed by the laws of the State of ${vars.state}, without regard to its conflict-of-laws rules, and the courts located in ${vars.state} have exclusive jurisdiction.`,
  }),
  general: (vars: ContractVars): Section => ({
    heading: "General terms",
    body: `This agreement, together with anything attached to it, is the whole agreement between the parties about this work and replaces earlier discussions. It may only be changed in writing agreed by both parties (an email exchange is enough). Neither party may transfer it without the other's written consent, except to a successor of its whole business. If a part is found unenforceable, the rest stays in force. A delay in enforcing a right is not giving it up. Neither party is liable for a delay caused by events outside its reasonable control, other than a duty to pay money. Notices may be given by email to ${vars.businessEmail || "the Agency's usual email address"} for the Agency and to ${vars.clientEmail || "the Client's email address on file"} for the Client. The parties may sign electronically and in counterparts, and an electronic signature has the same effect as a handwritten one.`,
  }),
  shoots: (): Section => ({
    heading: "Shoots, rescheduling and cancelling",
    body: "Shoot days are agreed in advance. If the Client reschedules with at least 48 hours' notice there is no charge. With less notice, or if the Client is not ready on the day, the Agency may charge 50% of that shoot's fee, and the full fee for a no-show. The Client will make sure the location is safe and available, and that everyone who will appear is aware of the filming. Weather and safety may require a shoot to be moved, in which case no fee applies.",
  }),
  platforms: (): Section => ({
    heading: "Platform rules",
    body: "Services run on third-party platforms (such as Meta, Google, TikTok and YouTube) that set their own rules and can change, reject, limit or remove content, ads and accounts at any time. The Agency is not responsible for a platform's decisions, outages or changes, and will help the Client respond to them as part of the monthly service where reasonable.",
  }),
  adSpend: (): Section => ({
    heading: "Ad spend",
    body: "Advertising spend is separate from the Agency's fees. The Client pays platforms directly through its own account and payment method, and agrees the monthly budget with the Agency in writing. The Agency will not exceed the agreed budget without written approval, and is not responsible for charges the Client's platform account makes under its own settings.",
  }),
  care: (): Section => ({
    heading: "What the plan covers",
    body: "The plan covers the items listed in the scope. Requests for new features, redesigns, large content changes or work caused by the Client's or a third party's changes are outside the plan and are quoted separately. Unused hours do not carry over to the next month. The Agency will respond to urgent problems as quickly as it reasonably can during business hours, but does not promise a particular response time, uptime or fix time, and hosting is provided by third parties on their own terms.",
  }),
  hourly: (): Section => ({
    heading: "Time and estimates",
    body: "Any estimate of hours or cost is a good-faith guess and not a cap or fixed price, unless the Agency says in writing that it is. The Agency will tell the Client when work is likely to pass an estimate. Advice is given in good faith based on what the Agency knows, and the Client decides what to do with it.",
  }),
  approval: (): Section => ({
    heading: "Approvals and revisions",
    body: "The Agency will send content or work for approval before it is published or launched. The Client will reply within 3 business days; if it does not, the Agency may publish or launch what was sent or pause until the Client replies. Reasonable revisions of agreed content are included; new ideas, extra formats and re-shoots are extra.",
  }),
  assets: (): Section => ({
    heading: "Design assets and licences",
    body: "Where the work uses fonts, stock images, icons or other third-party assets, the Agency will tell the Client which licences are needed. The Client pays for licences it needs for its own use, and the licence terms apply. The Agency is not responsible for the Client's use of the assets outside those terms.",
  }),
};

const NDA_SECTIONS = (vars: ContractVars): Section[] => [
  {
    heading: "Purpose",
    body: `${vars.businessName} and ${party(vars)} want to discuss ${vars.scope.trim() || "a possible business relationship"} (the "Purpose"). To do so they may share information that is private. Each party may be the one sharing or the one receiving.`,
  },
  {
    heading: "What is confidential",
    body: "\"Confidential Information\" means anything one party shares with the other for the Purpose that is marked confidential or that a reasonable person would understand to be private, including plans, finances, pricing, customers, software, designs, processes and passwords, in any form.",
  },
  {
    heading: "What each party must do",
    body: "The receiving party will keep Confidential Information secret using at least the care it uses for its own private information (and never less than reasonable care), use it only for the Purpose, not share it except with its own staff and advisers who need it and are bound to keep it private, and tell the other party promptly if it learns of any misuse.",
  },
  {
    heading: "Exceptions",
    body: "The duties above do not apply to information that is or becomes public through no fault of the receiving party, that the receiving party already knew or learned lawfully from someone else, that it develops on its own without using the other's information, or that it must disclose by law (in which case it will give notice where allowed and share only what is required).",
  },
  {
    heading: "How long it lasts",
    body: "These duties apply from the date below for 2 years after the last disclosure, and for as long as any trade secret remains a trade secret.",
  },
  {
    heading: "Returning information",
    body: "When asked in writing, the receiving party will return or delete the other's Confidential Information, except for copies it must keep by law or in routine backups, which stay protected by this agreement.",
  },
  {
    heading: "No other rights",
    body: "Nothing here gives either party any ownership or licence over the other's information, or obliges either party to go ahead with any deal. Information is provided \"as is\".",
  },
  {
    heading: "Remedies",
    body: "Each party agrees that misuse of Confidential Information could cause harm that money alone cannot fix, so the other party may ask a court for an order to stop it, as well as any other remedy the law allows.",
  },
  clauses.disputes(vars),
  clauses.general(vars),
];

function sectionsFor(type: WorkTypeKey, vars: ContractVars): Section[] {
  switch (type) {
    case "software":
      return [clauses.scope(vars, "The Agency will agree the main milestones and dates with the Client in writing at the start of the work.\n\n"), clauses.fees(vars), clauses.clientDuties(), clauses.acceptance(vars), clauses.ipProject(), clauses.data(), clauses.warranty(vars), clauses.confidentiality(), clauses.liability(), clauses.indemnity(), clauses.termProject(vars), clauses.contractor(), clauses.nonSolicit(), clauses.disputes(vars), clauses.general(vars)];
    case "website":
      return [clauses.scope(vars), clauses.fees(vars, "Domains and hosting are the Client's cost unless this agreement says otherwise, and the Client should keep them in its own name."), clauses.clientDuties(), clauses.acceptance(vars), clauses.ipProject(), clauses.warranty(vars), clauses.confidentiality(), clauses.liability(), clauses.indemnity(), clauses.termProject(vars), clauses.contractor(), clauses.disputes(vars), clauses.general(vars)];
    case "retainer":
      return [clauses.scope(vars), clauses.fees(vars), clauses.clientDuties(), clauses.access(), clauses.reporting(), clauses.noGuarantee("Marketing and growth results"), clauses.ipProject(), clauses.confidentiality(), clauses.liability(), clauses.indemnity(), clauses.termRecurring(vars), clauses.contractor(), clauses.nonSolicit(), clauses.disputes(vars), clauses.general(vars)];
    case "seo":
      return [clauses.scope(vars), clauses.fees(vars), clauses.clientDuties(), clauses.access(), { heading: "How the SEO work is done", body: "The Agency will use search engines' published guidelines and generally accepted ethical practices, and will not use link schemes, hidden text or other practices that break those guidelines. The Client approves content and significant site changes before they go live. Where the Agency edits the Client's website, the Client is responsible for keeping backups, and the Agency will tell the Client about changes it makes." }, clauses.noGuarantee("Search rankings, traffic and leads"), clauses.reporting(), clauses.ipProject(), clauses.confidentiality(), clauses.liability(), clauses.indemnity(), clauses.termRecurring(vars), clauses.contractor(), clauses.disputes(vars), clauses.general(vars)];
    case "ads":
      return [clauses.scope(vars), clauses.fees(vars), clauses.adSpend(), clauses.clientDuties(), clauses.access(), clauses.platforms(), clauses.noGuarantee("Advertising results"), clauses.reporting(), clauses.ipContent(), clauses.confidentiality(), clauses.liability(), clauses.indemnity(), clauses.termRecurring(vars), clauses.contractor(), clauses.disputes(vars), clauses.general(vars)];
    case "content":
      return [clauses.scope(vars), clauses.fees(vars), clauses.clientDuties(), clauses.shoots(), clauses.approval(), clauses.ipContent(), clauses.platforms(), clauses.noGuarantee("Reach, followers, engagement and sales"), clauses.confidentiality(), clauses.liability(), clauses.indemnity(), clauses.termRecurring(vars), clauses.contractor(), clauses.disputes(vars), clauses.general(vars)];
    case "care":
      return [clauses.scope(vars), clauses.fees(vars), clauses.care(), clauses.clientDuties(), clauses.access(), clauses.data(), clauses.warranty(vars), clauses.confidentiality(), clauses.liability(), clauses.termRecurring(vars), clauses.contractor(), clauses.disputes(vars), clauses.general(vars)];
    case "branding":
      return [clauses.scope(vars), clauses.fees(vars), clauses.clientDuties(), clauses.acceptance(vars), clauses.ipProject(), clauses.assets(), clauses.confidentiality(), clauses.liability(), clauses.indemnity(), clauses.termProject(vars), clauses.contractor(), clauses.disputes(vars), clauses.general(vars)];
    case "consulting":
      return [clauses.scope(vars), clauses.fees(vars), clauses.hourly(), clauses.clientDuties(), clauses.ipProject(), clauses.confidentiality(), clauses.liability(), clauses.termProject(vars), clauses.contractor(), clauses.disputes(vars), clauses.general(vars)];
    case "nda":
      return NDA_SECTIONS(vars);
    default:
      return [clauses.scope(vars), clauses.fees(vars), clauses.clientDuties(), clauses.acceptance(vars), clauses.ipProject(), clauses.warranty(vars), clauses.confidentiality(), clauses.liability(), clauses.indemnity(), clauses.termProject(vars), clauses.contractor(), clauses.disputes(vars), clauses.general(vars)];
  }
}

/** The full contract as plain text, every blank filled in from `vars`. */
export function buildContractBody(type: WorkTypeKey, vars: ContractVars, title?: string): string {
  const info = workType(type);
  const heading = (title || info.name).toUpperCase();
  const intro =
    type === "nda"
      ? `This mutual confidentiality agreement is made on ${vars.date} between ${vars.businessName} and ${party(vars)}.`
      : `This agreement is made on ${vars.date} between ${vars.businessName} (the "Agency") and ${party(vars)} (the "Client"). By signing, both parties agree to everything below.`;
  const sections = sectionsFor(type, vars)
    .map((section, index) => `${index + 1}. ${section.heading}\n${section.body}`)
    .join("\n\n");
  const contact = [vars.clientEmail && `Email: ${vars.clientEmail}`, vars.clientPhone && `Phone: ${vars.clientPhone}`, vars.clientWebsite && `Website: ${vars.clientWebsite}`].filter(Boolean).join("\n");
  const parties = `PARTIES\n\nAgency: ${vars.businessName}${vars.businessEmail ? `\nEmail: ${vars.businessEmail}` : ""}\n\nClient: ${party(vars)}${contact ? `\n${contact}` : ""}`;
  return `${heading}\n\n${intro}\n\n${parties}\n\n${sections}\n\nSIGNATURES\n\nThe Client signs electronically through the secure link provided by the Agency. The signature, the time, and a copy of this exact text are recorded, and the Agency's acceptance is given by sending this agreement.`;
}

/* ── Picking the likely type of work ───────────────────────────────────────────────────────── */

const KEYWORDS: [RegExp, WorkTypeKey][] = [
  [/\b(seo|search engine|local search)\b/i, "seo"],
  [/\b(meta ads?|facebook ads?|google ads?|paid ads?|ads management|advertis)/i, "ads"],
  [/\b(social|video|content|shoot|reels?|photo)/i, "content"],
  [/\b(care plan|maintenance|hosting|support plan|retainer care)/i, "care"],
  [/\b(crm|software|app\b|application|integration|automation)/i, "software"],
  [/\b(website|web site|landing page|web design|redesign)/i, "website"],
  [/\b(brand|logo|identity|graphic)/i, "branding"],
  [/\b(consult|strategy|advice|coaching)/i, "consulting"],
];

/** Best guess at the type of work from the customer's services and quotes; recurring work falls back to a monthly retainer. */
export function suggestWorkType(names: string[], hasRecurring: boolean): WorkTypeKey | null {
  for (const name of names) {
    const hit = KEYWORDS.find(([pattern]) => pattern.test(name));
    if (hit) return hit[1];
  }
  return hasRecurring ? "retainer" : null;
}

export function longDate(now = new Date()): string {
  return now.toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" });
}
