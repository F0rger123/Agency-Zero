"use client";

import { useActionState } from "react";
import type { ActionState } from "@/lib/forms";
import { completeReminderAction, createReminderAction, deleteReminderAction } from "./actions";
import { FieldLabel, FormMessage, SubmitButton, TextArea, TextInput } from "@/components/form-controls";
const initialState: ActionState = {};
export function ReminderForm() { const [state, action] = useActionState(createReminderAction, initialState); return <form action={action} className="space-y-4"><div><FieldLabel label="Reminder" htmlFor="reminder-message" required /><TextArea id="reminder-message" name="message" required rows={3} placeholder="Follow up with client about assets" /></div><div><FieldLabel label="Due" htmlFor="reminder-due" required /><TextInput id="reminder-due" name="due_at" type="datetime-local" required /></div><div className="flex flex-wrap items-center gap-4"><SubmitButton>Create reminder</SubmitButton><FormMessage {...state} /></div></form>; }
export function CompleteReminderForm({ id }: { id: string }) { const [state, action] = useActionState(completeReminderAction, initialState); return <form action={action} className="flex flex-wrap gap-3"><input type="hidden" name="id" value={id} /><SubmitButton pendingLabel="Completing…" className="bg-background px-0 py-0 text-xs font-normal text-muted-foreground ring-0">Complete</SubmitButton><FormMessage {...state} /></form>; }
export function DeleteReminderForm({ id }: { id: string }) { const [state, action] = useActionState(deleteReminderAction, initialState); return <form action={action} className="flex flex-wrap gap-3"><input type="hidden" name="id" value={id} /><SubmitButton pendingLabel="Removing…" className="bg-background px-0 py-0 text-xs font-normal text-muted-foreground ring-0">Remove</SubmitButton><FormMessage {...state} /></form>; }
