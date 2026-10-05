/** Project phases and templates (migration 0025): labels, the template text format, and the missing-migration check. */
export const PHASE_STATUSES = ["upcoming", "active", "done"] as const;
export type PhaseStatus = (typeof PHASE_STATUSES)[number];

export const PHASE_STATUS_LABEL: Record<PhaseStatus, string> = { upcoming: "Upcoming", active: "In progress", done: "Done" };

export const SERVICE_KINDS = ["software", "websites", "seo", "meta_ads", "social", "content", "other"] as const;
export type ServiceKind = (typeof SERVICE_KINDS)[number];

export const SERVICE_KIND_LABEL: Record<ServiceKind, string> = {
  software: "Software & CRMs",
  websites: "Websites",
  seo: "SEO",
  meta_ads: "Meta ads",
  social: "Social media",
  content: "Video & content",
  other: "Other",
};

export type TemplateTask = { title: string; priority?: string; day?: number };
export type TemplatePhase = { name: string; tasks: TemplateTask[] };

const PRIORITIES = ["low", "medium", "high", "urgent"];

/**
 * Template editor text format, one phase per heading and one task per bullet:
 *
 *   ## Discovery
 *   - Kickoff call and goals | high | 0
 *   - Map the current workflow | | 3
 *
 * Task = `title | priority | day`; priority and day (days after the start date) are optional.
 */
export function parseTemplateText(text: string): { phases: TemplatePhase[] } | { error: string } {
  const phases: TemplatePhase[] = [];
  for (const [index, raw] of text.split("\n").entries()) {
    const line = raw.trim();
    if (!line) continue;
    if (line.startsWith("#")) {
      const name = line.replace(/^#+\s*/, "").trim();
      if (!name) return { error: `Line ${index + 1}: a phase needs a name.` };
      if (name.length > 120) return { error: `Line ${index + 1}: phase names must be 120 characters or fewer.` };
      phases.push({ name, tasks: [] });
      continue;
    }
    const current = phases[phases.length - 1];
    if (!current) return { error: `Line ${index + 1}: start with a phase heading such as "## Discovery".` };
    const [titlePart, priorityPart = "", dayPart = ""] = line.replace(/^[-*•]\s*/, "").split("|").map((part) => part.trim());
    if (!titlePart) return { error: `Line ${index + 1}: a task needs a title.` };
    if (titlePart.length > 240) return { error: `Line ${index + 1}: task titles must be 240 characters or fewer.` };
    const task: TemplateTask = { title: titlePart };
    if (priorityPart) {
      if (!PRIORITIES.includes(priorityPart.toLowerCase())) return { error: `Line ${index + 1}: priority must be low, medium, high or urgent.` };
      task.priority = priorityPart.toLowerCase();
    }
    if (dayPart) {
      const day = Number(dayPart);
      if (!Number.isInteger(day) || day < 0 || day > 3650) return { error: `Line ${index + 1}: the day must be a whole number of days from the start.` };
      task.day = day;
    }
    current.tasks.push(task);
  }
  if (phases.length === 0) return { error: "Add at least one phase." };
  if (phases.length > 30) return { error: "Use 30 phases or fewer." };
  if (phases.reduce((sum, phase) => sum + phase.tasks.length, 0) > 300) return { error: "Use 300 tasks or fewer." };
  return { phases };
}

export function templateToText(phases: unknown): string {
  if (!Array.isArray(phases)) return "";
  return (phases as TemplatePhase[])
    .map((phase) =>
      [
        `## ${phase.name}`,
        ...(phase.tasks ?? []).map((task) => {
          const parts = [task.title, task.priority ?? "", task.day != null ? String(task.day) : ""];
          while (parts.length > 1 && parts[parts.length - 1] === "") parts.pop();
          return `- ${parts.join(" | ")}`;
        }),
      ].join("\n"),
    )
    .join("\n\n");
}

/** True when a database error means migration 0025 has not been applied. */
export const needsPhasesMigration = (message: string): boolean =>
  /project_phases|project_templates|phase_id|apply_project_template|move_project_phase|get_project_phases|schema cache/i.test(message);

export const PHASES_MIGRATION_MESSAGE = "Project phases need database update 0025. Apply it in the Supabase SQL editor, then try again.";
