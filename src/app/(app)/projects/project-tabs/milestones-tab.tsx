"use client";

import { FormSection } from "@/components/form-controls";
import { MilestoneBlock, ProjectMilestoneForm } from "../project-workspace-forms";
import type { ProjectWorkspaceData } from "../project-workspace-types";
import { Empty } from "../project-workspace-parts";

export function MilestonesTab({ data }: { data: ProjectWorkspaceData }) {
  return (
    <div className="space-y-12">
      <FormSection
        title="Goals & milestones"
        description="Goals for this project, with the tasks linked to each one. Milestones created here belong to this project."
      >
        {data.milestones.length === 0 ? (
          <Empty>No milestones yet. Add the first goal below.</Empty>
        ) : (
          <div className="space-y-6">
            {data.milestones.map((milestone) => (
              <MilestoneBlock key={milestone.id} projectId={data.project.id} milestone={milestone} />
            ))}
          </div>
        )}
      </FormSection>
      <FormSection
        title="Add a milestone"
        description="Name it, give it a due date, then complete it from the list above."
      >
        <ProjectMilestoneForm projectId={data.project.id} />
      </FormSection>
    </div>
  );
}
