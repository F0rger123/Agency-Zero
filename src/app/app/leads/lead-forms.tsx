"use client";

import { useActionState } from "react";
import type { ActionState } from "@/lib/forms";
import { FormMessage, SubmitButton } from "@/components/form-controls";
import { convertLeadAction, setLeadStatusAction } from "./actions";

const initialState: ActionState = {};
const quiet = "bg-background px-0 py-0 text-xs font-normal text-muted-foreground ring-0";

export function LeadStatusForm({ id, status, label }: { id: string; status: string; label: string }) {
  const [state, action] = useActionState(setLeadStatusAction, initialState);
  return (
    <form action={action} className="flex items-center gap-3">
      <input type="hidden" name="id" value={id} />
      <input type="hidden" name="status" value={status} />
      <SubmitButton pendingLabel="Saving…" className={quiet}>
        {label}
      </SubmitButton>
      <FormMessage {...state} />
    </form>
  );
}

export function ConvertLeadForm({ id }: { id: string }) {
  const [state, action] = useActionState(convertLeadAction, initialState);
  return (
    <form action={action} className="flex items-center gap-3">
      <input type="hidden" name="id" value={id} />
      <SubmitButton pendingLabel="Converting…">Convert to client</SubmitButton>
      <FormMessage {...state} />
    </form>
  );
}
