"use client";

import { useActionState, useCallback, useState } from "react";
import { FormMessage } from "@/components/form-controls";
import { Modal, ModalContext } from "@/components/modal";
import type { ActionState } from "@/lib/forms";

/**
 * A quiet text button that asks "are you sure?" in a dialog before running a destructive server action.
 * `fields` become hidden inputs; the dialog closes itself when the action succeeds.
 */
export function ConfirmDelete({
  action,
  fields,
  label = "Delete",
  title,
  message,
  confirmLabel = "Delete",
  className = "text-xs text-muted-foreground hover:text-foreground",
}: {
  action: (previous: ActionState, formData: FormData) => Promise<ActionState>;
  fields: Record<string, string>;
  label?: string;
  title: string;
  message: string;
  confirmLabel?: string;
  className?: string;
}) {
  const [open, setOpen] = useState(false);
  const close = useCallback(() => setOpen(false), []);
  const [state, formAction, pending] = useActionState(action, {} as ActionState);
  return (
    <>
      <button type="button" onClick={() => setOpen(true)} className={`press underline-offset-4 transition-colors hover:underline ${className}`}>
        {label}
      </button>
      <ModalContext.Provider value={{ close }}>
        <Modal open={open} onClose={close} title={title}>
          <form action={formAction} className="space-y-6">
            {Object.entries(fields).map(([name, value]) => (
              <input key={name} type="hidden" name={name} value={value} />
            ))}
            <p className="text-sm leading-6 text-muted-foreground">{message}</p>
            <div className="flex flex-wrap items-center gap-3">
              <button
                type="submit"
                disabled={pending}
                className="press rounded-md bg-red-600 px-4 py-2 text-sm font-medium text-white transition-opacity hover:opacity-85 disabled:cursor-wait disabled:opacity-50"
              >
                {pending ? "Deleting…" : confirmLabel}
              </button>
              <button type="button" onClick={close} className="press rounded-md border border-border px-4 py-2 text-sm transition-colors hover:bg-muted">
                Cancel
              </button>
              <FormMessage {...state} />
            </div>
          </form>
        </Modal>
      </ModalContext.Provider>
    </>
  );
}
