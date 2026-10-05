import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { isMissingTable } from "@/lib/forms";
import { dateLabel } from "@/lib/format";
import { PageHeader } from "@/components/page-header";
import { DataFailure, MigrationsRequired, SetupRequired } from "@/components/states";
import { ProjectWorkspace, type ProjectWorkspaceData } from "../project-workspace";
import type { WorkItemsPayload } from "../project-tabs/work-items";
import type { ProjectPhasesPayload } from "../project-tabs/phases";

export const metadata: Metadata = { title: "Project" };

/**
 * Project detail = one tabbed workspace.
 *
 * A project is meant to be run almost entirely from inside the project, so a
 * single `get_project_workspace(p_project_id)` read (migration 0013) provides
 * every tab: overview, tasks, goals/milestones, timeline, time, files, notes,
 * client, financials, and settings. Tasks, subtasks, and milestones created in
 * these tabs are automatically associated with this project.
 */
export default async function ProjectDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  if (!isSupabaseConfigured()) return <SetupRequired />;

  const { id } = await params;
  const supabase = await createClient();
  const [{ data, error }, workItemsResponse, phasesResponse] = await Promise.all([
    supabase.rpc("get_project_workspace", { p_project_id: id }),
    // Bugs and feature requests (0023). A database that has not applied it yet degrades to a hint inside those tabs.
    supabase.rpc("get_project_work_items", { p_project_id: id }),
    // Phases and templates (0025), same graceful degradation.
    supabase.rpc("get_project_phases", { p_project_id: id }),
  ]);
  const phases = phasesResponse.error ? null : (phasesResponse.data as ProjectPhasesPayload | null);
  const workItems = workItemsResponse.error ? null : (workItemsResponse.data as WorkItemsPayload | null);

  const backLink = (
    <Link
      href="/app/projects"
      className="text-sm text-muted-foreground underline decoration-border underline-offset-4 hover:text-foreground"
    >
      ← All projects
    </Link>
  );

  if (error) {
    if (isMissingTable(error.message)) {
      return (
        <>
          {backLink}
          <PageHeader title="Project" />
          <MigrationsRequired detail={error.message} />
        </>
      );
    }
    return (
      <>
        {backLink}
        <PageHeader title="Project" />
        <DataFailure
          title="Project workspace"
          message={error.message}
          hint="The workspace is one database read: public.get_project_workspace(p_project_id). The exact error is below."
        />
      </>
    );
  }

  if (!data) notFound();

  const base = data as ProjectWorkspaceData;
  // Bugs and feature requests live in their own tabs: keep them out of the plain task list and its open count.
  const workItemIds = new Set((workItems?.items ?? []).map((item) => item.id));
  const openWorkItems = (workItems?.items ?? []).filter((item) => item.status !== "done" && item.status !== "cancelled").length;
  const doneWorkItems = (workItems?.items ?? []).filter((item) => item.status === "done").length;
  const workspace = {
    ...base,
    tasks: base.tasks.filter((task) => !workItemIds.has(task.id)),
    totals: {
      ...base.totals,
      open_tasks: Math.max(0, base.totals.open_tasks - openWorkItems),
      done_tasks: Math.max(0, base.totals.done_tasks - doneWorkItems),
    },
    work_items: workItems,
    phases,
  };
  const { project, client, totals } = workspace;

  return (
    <>
      {backLink}
      <PageHeader
        title={project.name}
        description={[
          client?.name,
          project.status.replaceAll("_", " "),
          project.deadline ? `Deadline ${dateLabel(project.deadline)}` : "No deadline",
          `${totals.open_tasks} open tasks`,
        ]
          .filter(Boolean)
          .join(" · ")}
      />
      <ProjectWorkspace data={workspace} />
    </>
  );
}
