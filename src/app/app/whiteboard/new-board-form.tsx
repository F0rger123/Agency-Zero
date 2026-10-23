"use client";

import { useActionState, useState } from "react";
import { FormMessage, SubmitButton } from "@/components/form-controls";
import type { ActionState } from "@/lib/forms";
import { TEMPLATES } from "@/lib/whiteboard/templates";
import { createWhiteboardAction } from "./actions";

const initial: ActionState = {};
const field = "block w-full rounded-md border border-border bg-background px-3 py-2.5 text-sm outline-none transition-colors focus:border-foreground";

export function NewBoardForm({ clients }: { clients: { id: string; label: string }[] }) {
  const [state, action] = useActionState(createWhiteboardAction, initial);
  const [template, setTemplate] = useState("sales");
  return (
    <form action={action} className="space-y-4">
      <input type="hidden" name="template" value={template} />
      <fieldset>
        <legend className="text-xs font-medium text-muted-foreground">Start from a template</legend>
        <div className="mt-2 grid max-h-[40dvh] gap-2 overflow-y-auto overscroll-contain pr-1 sm:grid-cols-2" role="radiogroup" aria-label="Template">
          {TEMPLATES.map((item) => (
            <button
              key={item.key}
              type="button"
              role="radio"
              aria-checked={template === item.key}
              onClick={() => setTemplate(item.key)}
              className={`press rounded-xl border p-3 text-left transition-colors ${template === item.key ? "border-foreground bg-muted" : "border-border hover:bg-muted"}`}
            >
              <span className="block text-sm font-medium">{item.name}</span>
              <span className="mt-0.5 block text-xs leading-5 text-muted-foreground">{item.description}</span>
              <span className="mt-1.5 block text-[11px] text-faint-foreground">{item.frames.length} {item.frames.length === 1 ? "frame" : "frames"}</span>
            </button>
          ))}
        </div>
      </fieldset>
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
