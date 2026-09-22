"use client";

import { useEffect, useState, type ReactNode } from "react";
import { createSignedFileLinksAction } from "@/lib/file-actions";
import { dateTimeLabel, fileSizeLabel } from "@/lib/format";

export type FileRow = {
  id: string;
  file_name: string;
  storage_path: string;
  mime_type?: string | null;
  size_bytes?: number | null;
  created_at: string;
};

/**
 * Private file list with expiring signed links.
 *
 * Links are requested once, when the list mounts (i.e. when its tab is
 * opened), through a server action. The workspace payload only carries file
 * metadata, so data reads stay one round trip and signed URLs are created on
 * demand for the tab the owner is actually looking at. Links live for one hour.
 */
export function FileLinks({
  files,
  renderDelete,
  emptyLabel = "No files yet.",
}: {
  files: FileRow[];
  renderDelete?: (file: FileRow) => ReactNode;
  emptyLabel?: string;
}) {
  const [links, setLinks] = useState<Record<string, string>>({});
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (files.length === 0) return;
    let cancelled = false;
    const paths = files.map((file) => file.storage_path);

    createSignedFileLinksAction(paths)
      .then((result) => {
        if (cancelled) return;
        setLinks(result.links);
        setError(result.error ?? null);
      })
      .catch((cause: unknown) => {
        if (cancelled) return;
        setError(cause instanceof Error ? cause.message : "Could not create file links.");
      });

    return () => {
      cancelled = true;
    };
  }, [files]);

  if (files.length === 0) {
    return <p className="text-sm text-muted-foreground">{emptyLabel}</p>;
  }

  const pendingLinks = files.filter((file) => !links[file.storage_path]).length;

  return (
    <div aria-busy={pendingLinks > 0}>
      <ul className="divide-y divide-border border-y border-border">
        {files.map((file) => (
          <li key={file.id} className="flex flex-wrap items-center justify-between gap-4 py-4">
            <div className="min-w-0">
              <p className="font-medium">
                {links[file.storage_path] ? (
                  <a
                    href={links[file.storage_path]}
                    target="_blank"
                    rel="noreferrer"
                    className="underline decoration-border underline-offset-4"
                  >
                    {file.file_name} ↗
                  </a>
                ) : (
                  <>
                    {file.file_name}
                    <span className="ml-2 text-xs font-normal text-faint-foreground">
                      link pending
                    </span>
                  </>
                )}
              </p>
              <p className="mt-1 text-xs text-muted-foreground">
                {fileSizeLabel(file.size_bytes ?? null)} · {dateTimeLabel(file.created_at)}
              </p>
            </div>
            {renderDelete ? renderDelete(file) : null}
          </li>
        ))}
      </ul>
      {error ? (
        <p role="alert" className="mt-3 font-mono text-xs text-muted-foreground">
          {error}
        </p>
      ) : null}
    </div>
  );
}
