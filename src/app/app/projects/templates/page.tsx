import type { Metadata } from "next";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { FormSection } from "@/components/form-controls";
import { PageHeader } from "@/components/page-header";
import { DataFailure, MigrationsRequired, SetupRequired } from "@/components/states";
import { SERVICE_KIND_LABEL, needsPhasesMigration, type ServiceKind } from "@/lib/phases";
import { TemplateForm, type TemplateRow } from "./template-forms";

export const metadata: Metadata = { title: "Project templates" };

/** Reusable phase + task lists per service type (migration 0025). Apply one from a project's Phases tab. */
export default async function ProjectTemplatesPage() {
  if (!isSupabaseConfigured()) return <SetupRequired />;
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("project_templates")
    .select("id, name, service_kind, description, phases, active")
    .order("service_kind")
    .order("name")
    .limit(200);
  if (error) {
    if (needsPhasesMigration(error.message)) return <MigrationsRequired detail="Project templates need migration 0025." />;
    return <DataFailure title="Project templates" message={error.message} />;
  }
  const templates = (data ?? []) as TemplateRow[];
  return (
    <>
      <Link href="/app/projects" className="text-sm text-muted-foreground underline decoration-border underline-offset-4 hover:text-foreground">
        ← All projects
      </Link>
      <PageHeader
        title="Project templates"
        description="The usual phases and starter tasks for each kind of work. Open a project, go to its Phases tab and add one; due dates count from the start date you pick."
      />
      <ul className="divide-y divide-border border-y border-border">
        {templates.map((template) => {
          const phases = Array.isArray(template.phases) ? (template.phases as { name: string; tasks?: unknown[] }[]) : [];
          const taskCount = phases.reduce((sum, phase) => sum + (phase.tasks?.length ?? 0), 0);
          return (
            <li key={template.id} className="py-6">
              <p className="text-xs uppercase tracking-widest text-muted-foreground">
                {SERVICE_KIND_LABEL[template.service_kind as ServiceKind] ?? template.service_kind}
                {!template.active ? " · hidden" : ""}
              </p>
              <h2 className="mt-1 font-medium">{template.name}</h2>
              <p className="mt-1 text-sm text-muted-foreground">
                {phases.map((phase) => phase.name).join(" → ")} · {taskCount} starter tasks
              </p>
              <details className="mt-4">
                <summary className="cursor-pointer text-xs font-medium text-muted-foreground underline decoration-border underline-offset-4">Edit template</summary>
                <div className="mt-4">
                  <TemplateForm template={template} />
                </div>
              </details>
            </li>
          );
        })}
      </ul>
      <FormSection title="New template" description="Write phases with “## Name” and tasks as “- title | priority | day” (priority and day are optional; day is days after the project start).">
        <TemplateForm />
      </FormSection>
    </>
  );
}
