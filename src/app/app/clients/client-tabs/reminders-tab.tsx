"use client";

import { AddDialog } from "@/components/modal";
import { FormSection } from "@/components/form-controls";
import { dateTimeLabel } from "@/lib/format";
import { CompleteReminderForm, DeleteReminderForm, ReminderForm } from "../../reminders/reminder-forms";
import type { ClientWorkspaceData } from "../client-workspace-types";
import { Empty } from "../client-workspace-parts";

export type ClientReminder = { id: string; message: string; due_at: string };

export function RemindersTab({ data, reminders }: { data: ClientWorkspaceData; reminders: ClientReminder[] | null }) {
  return (
    <FormSection
      title="Reminders"
      description="Follow-ups for this client. They also show up in your main Reminders list."
      action={
        reminders ? (
          <AddDialog label="New reminder" title="New reminder" description={`For ${data.client.name}`}>
            <ReminderForm subject={{ type: "client", id: data.client.id }} />
          </AddDialog>
        ) : null
      }
    >
      {reminders === null ? (
        <Empty>Reminders could not be loaded. Check the database is up to date.</Empty>
      ) : reminders.length === 0 ? (
        <Empty>No reminders.</Empty>
      ) : (
        <ul className="divide-y divide-border border-y border-border">
          {reminders.map((item) => (
            <li key={item.id} className="flex flex-wrap items-start justify-between gap-4 py-4">
              <div>
                <p className="font-medium">{item.message}</p>
                <p className="mt-1 text-xs text-muted-foreground">Due {dateTimeLabel(item.due_at)}</p>
              </div>
              <div className="flex items-center gap-4">
                <CompleteReminderForm id={item.id} />
                <DeleteReminderForm id={item.id} />
              </div>
            </li>
          ))}
        </ul>
      )}
    </FormSection>
  );
}
