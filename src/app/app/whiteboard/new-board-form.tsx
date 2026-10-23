"use client";

import { useActionState } from "react";
import { FormMessage, SubmitButton } from "@/components/form-controls";
import type { ActionState } from "@/lib/forms";
import { createWhiteboardAction } from "./actions";

const initial: ActionState = {};
const field = "block w-full rounded-md border border-border bg-background px-3 py-2.5 text-sm outline-none transition-colors focus:border-foreground";

export function NewBoardForm({ clients }: { clients: { id: string; label: string }[] }) {
  const [state, action] = useActionState(createWhiteboardAction, initial);
  return (
    <form action={action} className="space-y-4">
      <p className="text-sm text-muted-foreground">Starts with four frames: their problem, what they need, how I help, and the path forward.</p>
      <div>
        <label htmlFor="wb-title" className="text-xs font-medium text-muted-foreground">Name</label>
        <input id="wb-title" name="title" required maxLength={200} placeholder="Call with Dana" className={`${field} mt-1`} />
      </div>
      <div>
        <label htmlFor="wb-client" className="text-xs font-medium text-muted-foreground">Customer (optional)</label>
        <select id="wb-client" name="client_id" className={`${field} mt-1`} defaultValue="">
          <option value="">Not linked to a customer</option>
          {clients.map((client) => (
            <option key={client.id} value={client.id}>{client.label}</option>
          ))}
        </select>
      </div>
      <div className="flex flex-wrap items-center gap-3">
        <SubmitButton pendingLabel="Opening…">Create and open</SubmitButton>
        <FormMessage {...state} />
      </div>
    </form>
  );
}
