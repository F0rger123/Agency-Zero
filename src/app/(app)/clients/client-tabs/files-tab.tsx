"use client";

import { FileLinks } from "@/components/file-links";
import { FormSection } from "@/components/form-controls";
import { DeleteFileForm, UploadFileForm } from "../client-forms";
import type { ClientWorkspaceData } from "../client-workspace-types";

export function FilesTab({ data }: { data: ClientWorkspaceData }) {
  return (
    <FormSection
      title="Files"
      description="Private files in the client-files bucket. Download links are created on demand and expire after one hour."
    >
      <FileLinks
        files={data.files}
        emptyLabel="No files uploaded yet."
        renderDelete={(file) => (
          <DeleteFileForm clientId={data.client.id} id={file.id} storagePath={file.storage_path} />
        )}
      />
      <div className="mt-6">
        <UploadFileForm clientId={data.client.id} />
      </div>
    </FormSection>
  );
}
