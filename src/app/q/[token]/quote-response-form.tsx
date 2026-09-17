"use client";

import { useActionState } from "react";
import type { ActionState } from "@/lib/forms";
import { FormMessage, SubmitButton } from "@/components/form-controls";
import { respondToQuoteAction } from "./actions";

const initialState: ActionState = {};
export function QuoteResponseForm({ token }: { token: string }) {
  const [state, action] = useActionState(respondToQuoteAction, initialState);
  return <form action={action} className="mt-8 flex flex-wrap items-center gap-4"><input type="hidden" name="token" value={token} /><button type="submit" name="decision" value="rejected" className="rounded-md border border-border px-4 py-2 text-sm font-medium hover:bg-muted">Reject quote</button><SubmitButton pendingLabel="Accepting…">Accept quote</SubmitButton><FormMessage {...state} /></form>;
}
