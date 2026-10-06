"use client";

import { FileLinks } from "@/components/file-links";
import { AddDialog } from "@/components/modal";
import { FormSection } from "@/components/form-controls";
import { DeleteFileForm, UploadFileForm } from "../client-forms";
import type { ClientWorkspaceData } from "../client-workspace-types";

export function FilesTab({ data }: { data: ClientWorkspaceData }) {
  return (
    <FormSection
      title="Files"
      description="Private files in the client-files bucket. Download links are created on demand and expire after one hour."
      action={
        <AddDialog label="Upload file" title="Upload a file" description={`For ${data.client.name}`}>
          <UploadFileForm clientId={data.client.id} />
        </AddDialog>
      }
    >
      <FileLinks
        files={data.files}
        emptyLabel="No files uploaded yet."
        renderDelete={(file) => (
          <DeleteFileForm clientId={data.client.id} id={file.id} storagePath={file.storage_path} />
        )}
      />
    </FormSection>
  );
}
