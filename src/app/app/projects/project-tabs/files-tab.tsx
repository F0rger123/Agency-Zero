"use client";

import { FileLinks } from "@/components/file-links";
import { FormSection } from "@/components/form-controls";
import { DeleteProjectFileForm, ProjectFileUploadForm } from "../project-workspace-forms";
import type { ProjectWorkspaceData } from "../project-workspace-types";

export function FilesTab({ data }: { data: ProjectWorkspaceData }) {
  return (
    <FormSection
      title="Files"
      description="Private project files, stored under projects/<project id>/ in the client-files bucket. Download links are created on demand and expire after one hour."
    >
      <FileLinks
        files={data.files}
        emptyLabel="No files uploaded yet."
        renderDelete={(file) => (
          <DeleteProjectFileForm projectId={data.project.id} fileId={file.id} storagePath={file.storage_path} />
        )}
      />
      <div className="mt-6">
        <ProjectFileUploadForm projectId={data.project.id} />
      </div>
    </FormSection>
  );
}
