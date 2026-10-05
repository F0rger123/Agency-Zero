"use client";

import Link from "next/link";
import { useActionState } from "react";
import { FieldLabel, FormMessage, SelectInput, SubmitButton, TextArea, TextInput } from "@/components/form-controls";
import { dateLabel } from "@/lib/format";
import { crmHref } from "@/lib/routes";
import type { ActionState } from "@/lib/forms";
import {
  KIND_LABEL,
  KIND_LABEL_PLURAL,
  SEVERITIES,
  SOURCE_LABEL,
  WORK_SOURCES,
  isOpenStatus,
  statusLabel,
  statusOptions,
  type WorkKind,
} from "@/lib/work-items";
import { completeTaskAction, createTaskAction, updateTaskAction } from "../../tasks/actions";
import type { ProjectWorkspaceData } from "../project-workspace-types";
import { Empty } from "../project-workspace-parts";

const initialState: ActionState = {};

export type WorkItem = {
  id: string;
  kind: WorkKind;
  title: string;
  description: string | null;
  status: string;
  priority: string;
  severity: string | null;
  due_date: string | null;
  source: string;
  resolution: string | null;
  requester_contact_id: string | null;
  requester_name: string | null;
  milestone_id: string | null;
  scheduled_date: string | null;
  estimated_minutes: number | null;
  actual_minutes: number | null;
  parent_task_id: string | null;
  depends_on_task_id: string | null;
  recurrence_rule: Record<string, unknown> | null;
  created_at: string;
  href: string;
};

export type WorkItemsPayload = {
  items: WorkItem[];
  open_bugs: number;
  open_critical: number;
  open_feature_requests: number;
  contacts: { id: string; name: string; role: string | null }[];
};

const severityTone: Record<string, string> = {
  critical: "border-foreground bg-foreground text-background",
  high: "border-foreground text-foreground",
  medium: "border-border text-muted-foreground",
  low: "border-border text-faint-foreground",
};

function Badge({ children, tone = "border-border text-muted-foreground" }: { children: React.ReactNode; tone?: string }) {
  return <span className={`rounded-full border px-2 py-0.5 text-[10px] font-medium uppercase tracking-widest ${tone}`}>{children}</span>;
}

/** Create or edit a bug / feature request without leaving the project. Unshown task fields are carried through. */
export function WorkItemForm({
  kind,
  projectId,
  clientId,
  contacts,
  item,
}: {
  kind: WorkKind;
  projectId: string;
  clientId: string | null;
  contacts: WorkItemsPayload["contacts"];
  item?: WorkItem;
}) {
  const [state, action] = useActionState(item ? updateTaskAction : createTaskAction, initialState);
  const key = item?.id ?? `new-${kind}`;
  const isBug = kind === "bug";

  return (
    <form action={action} className="space-y-4">
      {item ? <input type="hidden" name="id" value={item.id} /> : null}
      <input type="hidden" name="kind" value={kind} />
      <input type="hidden" name="project_id" value={projectId} />
      <input type="hidden" name="client_id" value={clientId ?? ""} />
      {item ? (
        <>
          <input type="hidden" name="scheduled_date" value={item.scheduled_date ?? ""} />
          <input type="hidden" name="estimated_hours" value={item.estimated_minutes != null ? item.estimated_minutes / 60 : ""} />
          <input type="hidden" name="actual_hours" value={item.actual_minutes != null ? item.actual_minutes / 60 : ""} />
          <input type="hidden" name="milestone_id" value={item.milestone_id ?? ""} />
          <input type="hidden" name="parent_task_id" value={item.parent_task_id ?? ""} />
          <input type="hidden" name="depends_on_task_id" value={item.depends_on_task_id ?? ""} />
          <input type="hidden" name="recurrence_rule" value={item.recurrence_rule ? JSON.stringify(item.recurrence_rule) : ""} />
        </>
      ) : null}

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="sm:col-span-2">
          <FieldLabel label={isBug ? "What is broken?" : "What is being asked for?"} htmlFor={`wi-title-${key}`} required />
          <TextInput
            id={`wi-title-${key}`}
            name="title"
            required
            defaultValue={item?.title}
            placeholder={isBug ? "Contact form does not send on Safari" : "Let customers book a callback"}
          />
        </div>
        <div>
          <FieldLabel label="Status" htmlFor={`wi-status-${key}`} required />
          <SelectInput id={`wi-status-${key}`} name="status" required defaultValue={item?.status ?? "todo"}>
            {statusOptions(kind).map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </SelectInput>
        </div>
        {isBug ? (
          <div>
            <FieldLabel label="Severity" htmlFor={`wi-severity-${key}`} hint="how bad is it" />
            <SelectInput id={`wi-severity-${key}`} name="severity" defaultValue={item?.severity ?? ""}>
              <option value="">Not rated</option>
              {SEVERITIES.map((value) => (
                <option key={value} value={value}>
                  {value[0].toUpperCase() + value.slice(1)}
                </option>
              ))}
            </SelectInput>
          </div>
        ) : null}
        <div>
          <FieldLabel label="Priority" htmlFor={`wi-priority-${key}`} required />
          <SelectInput id={`wi-priority-${key}`} name="priority" required defaultValue={item?.priority ?? "medium"}>
            <option value="low">Low</option>
            <option value="medium">Medium</option>
            <option value="high">High</option>
            <option value="urgent">Urgent</option>
          </SelectInput>
        </div>
        <div>
          <FieldLabel label="Target date" htmlFor={`wi-due-${key}`} />
          <TextInput id={`wi-due-${key}`} name="due_date" type="date" defaultValue={item?.due_date} />
        </div>
        <div>
          <FieldLabel label="Asked by" htmlFor={`wi-requester-${key}`} hint="client contact" />
          <SelectInput id={`wi-requester-${key}`} name="requester_contact_id" defaultValue={item?.requester_contact_id ?? ""}>
            <option value="">Nobody in particular</option>
            {contacts.map((contact) => (
              <option key={contact.id} value={contact.id}>
                {contact.name}
                {contact.role ? ` (${contact.role})` : ""}
              </option>
            ))}
          </SelectInput>
        </div>
        <div>
          <FieldLabel label="Where did it come from?" htmlFor={`wi-source-${key}`} />
          <SelectInput id={`wi-source-${key}`} name="source" defaultValue={item?.source ?? "client"}>
            {WORK_SOURCES.map((value) => (
              <option key={value} value={value}>
                {SOURCE_LABEL[value]}
              </option>
            ))}
          </SelectInput>
        </div>
      </div>

      <div>
        <FieldLabel label={isBug ? "Details and steps to reproduce" : "Details"} htmlFor={`wi-description-${key}`} />
        <TextArea id={`wi-description-${key}`} name="description" rows={3} defaultValue={item?.description} />
      </div>
      <div>
        <FieldLabel
          label={isBug ? "What fixed it / why not fixed" : "What shipped / why declined"}
          htmlFor={`wi-resolution-${key}`}
          hint="fill in when closing"
        />
        <TextArea id={`wi-resolution-${key}`} name="resolution" rows={2} defaultValue={item?.resolution} />
      </div>

      <div className="flex flex-wrap items-center gap-4">
        <SubmitButton>{item ? "Save" : isBug ? "Log bug" : "Log request"}</SubmitButton>
        <FormMessage {...state} />
      </div>
    </form>
  );
}

function CloseItemForm({ id, kind }: { id: string; kind: WorkKind }) {
  const [state, action] = useActionState(completeTaskAction, initialState);
  return (
    <form action={action} className="flex flex-wrap items-center gap-3">
      <input type="hidden" name="id" value={id} />
      <SubmitButton pendingLabel="Saving…">{kind === "bug" ? "Mark fixed" : "Mark shipped"}</SubmitButton>
      <FormMessage {...state} />
    </form>
  );
}

/** The Bugs / Feature requests tab. */
export function WorkItemsTab({ data, kind }: { data: ProjectWorkspaceData & { work_items: WorkItemsPayload | null }; kind: WorkKind }) {
  const payload = data.work_items;
  if (!payload) {
    return (
      <Empty>
        Bugs and feature requests need database update <code className="font-mono text-foreground">0023</code>. Apply it in the Supabase SQL editor and
        reload.
      </Empty>
    );
  }
  const items = payload.items.filter((item) => item.kind === kind);
  const open = items.filter((item) => isOpenStatus(item.status));
  const closed = items.filter((item) => !isOpenStatus(item.status));
  const isBug = kind === "bug";

  const row = (item: WorkItem) => (
    <div key={item.id} className="border-t border-border pt-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            {item.severity ? <Badge tone={severityTone[item.severity]}>{item.severity}</Badge> : null}
            <Badge>{statusLabel(item.kind, item.status)}</Badge>
            {item.priority === "urgent" || item.priority === "high" ? <Badge>{item.priority} priority</Badge> : null}
          </div>
          <h3 className="mt-2 font-medium">
            <Link href={crmHref(item.href)} className="underline decoration-border underline-offset-4">
              {item.title}
            </Link>
          </h3>
          <p className="mt-1 text-sm text-muted-foreground">
            {[
              item.requester_name ? `asked by ${item.requester_name}` : SOURCE_LABEL[item.source as keyof typeof SOURCE_LABEL] ?? item.source,
              item.due_date ? `target ${dateLabel(item.due_date)}` : null,
              `logged ${dateLabel(item.created_at.slice(0, 10))}`,
            ]
              .filter(Boolean)
              .join(" · ")}
          </p>
          {item.description ? <p className="mt-2 whitespace-pre-wrap text-sm leading-6">{item.description}</p> : null}
          {item.resolution ? (
            <p className="mt-2 border-l-2 border-border pl-3 text-sm leading-6 text-muted-foreground">
              <span className="font-medium text-foreground">{isBug ? "Resolution: " : "Outcome: "}</span>
              {item.resolution}
            </p>
          ) : null}
        </div>
        {isOpenStatus(item.status) ? <CloseItemForm id={item.id} kind={item.kind} /> : null}
      </div>
      <details className="mt-4">
        <summary className="cursor-pointer text-xs font-medium text-muted-foreground underline decoration-border underline-offset-4">
          Edit
        </summary>
        <div className="mt-4">
          <WorkItemForm kind={kind} projectId={data.project.id} clientId={data.project.client_id} contacts={payload.contacts} item={item} />
        </div>
      </details>
    </div>
  );

  return (
    <div className="space-y-12">
      <section>
        <h2 className="text-xs font-medium uppercase tracking-widest text-muted-foreground">
          {open.length} open {isBug ? (open.length === 1 ? "bug" : "bugs") : open.length === 1 ? "request" : "requests"}
          {isBug && payload.open_critical > 0 ? ` · ${payload.open_critical} critical` : ""}
        </h2>
        <div className="mt-4 space-y-8">
          {open.length === 0 ? (
            <Empty>{isBug ? "No open bugs. Log one below when a client reports a problem." : "No open requests. Log one below when a client asks for something new."}</Empty>
          ) : (
            open.map(row)
          )}
        </div>
      </section>

      <section>
        <h2 className="text-xs font-medium uppercase tracking-widest text-muted-foreground">
          Log a {KIND_LABEL[kind].toLowerCase()}
        </h2>
        <div className="mt-4">
          <WorkItemForm kind={kind} projectId={data.project.id} clientId={data.project.client_id} contacts={payload.contacts} />
        </div>
      </section>

      {closed.length > 0 ? (
        <section>
          <h2 className="text-xs font-medium uppercase tracking-widest text-muted-foreground">
            {isBug ? "Fixed and closed" : "Shipped and closed"} ({closed.length})
          </h2>
          <div className="mt-4 space-y-8">{closed.map(row)}</div>
        </section>
      ) : null}
      <p className="text-xs text-faint-foreground">
        {KIND_LABEL_PLURAL[kind]} are tracked like tasks (priority, target date, time, calendar) and also appear on the Tasks page.
      </p>
    </div>
  );
}
