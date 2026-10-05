"use client";

import { useActionState } from "react";
import { FieldLabel, FormMessage, SelectInput, SubmitButton, TextArea, TextInput } from "@/components/form-controls";
import type { ActionState } from "@/lib/forms";
import { FREQUENCIES, SHOOT_STATUSES, STATUS_LABEL, WEEKDAYS, WEEK_OF_MONTH_LABEL, checklistToText } from "@/lib/shoots";
import {
  createShootAction,
  extendShootScheduleAction,
  saveShootScheduleAction,
  setShootScheduleActiveAction,
  toggleShootChecklistAction,
  updateShootAction,
} from "./actions";

const initialState: ActionState = {};
const quiet = "bg-background px-0 py-0 text-xs font-normal text-muted-foreground ring-0 hover:text-foreground";

export type ShootSchedule = {
  id: string;
  client_id: string;
  client_name: string;
  project_id: string | null;
  title: string;
  frequency: string;
  weekday: number;
  week_of_month: number | null;
  start_time: string | null;
  duration_minutes: number;
  location: string | null;
  checklist: unknown;
  notes: string | null;
  starts_on: string;
  ends_on: string | null;
  active: boolean;
  next_shoot: string | null;
  generated_through: string | null;
};

export type Shoot = {
  id: string;
  schedule_id: string | null;
  client_id: string;
  client_name: string;
  project_id: string | null;
  title: string;
  shoot_date: string;
  start_time: string | null;
  duration_minutes: number;
  location: string | null;
  status: string;
  checklist: unknown;
  notes: string | null;
};

export type ClientOption = { id: string; name: string };
export type ProjectOption = { id: string; name: string; client_id: string };

const trimTime = (time: string | null | undefined) => (time ? time.slice(0, 5) : "");

function ClientAndProject({
  clients,
  projects,
  lockedClientId,
  keyPrefix,
  defaultClient,
  defaultProject,
}: {
  clients: ClientOption[];
  projects: ProjectOption[];
  lockedClientId?: string;
  keyPrefix: string;
  defaultClient?: string;
  defaultProject?: string | null;
}) {
  const visibleProjects = lockedClientId ? projects.filter((project) => project.client_id === lockedClientId) : projects;
  return (
    <>
      <div>
        <FieldLabel label="Client" htmlFor={`${keyPrefix}-client`} required />
        {lockedClientId ? (
          <>
            <input type="hidden" name="client_id" value={lockedClientId} />
            <p className="flex h-10 items-center text-sm">{clients.find((client) => client.id === lockedClientId)?.name ?? "This client"}</p>
          </>
        ) : (
          <SelectInput id={`${keyPrefix}-client`} name="client_id" required defaultValue={defaultClient ?? ""}>
            <option value="">Choose a client</option>
            {clients.map((client) => (
              <option key={client.id} value={client.id}>
                {client.name}
              </option>
            ))}
          </SelectInput>
        )}
      </div>
      <div>
        <FieldLabel label="Project" htmlFor={`${keyPrefix}-project`} hint="optional" />
        <SelectInput id={`${keyPrefix}-project`} name="project_id" defaultValue={defaultProject ?? ""}>
          <option value="">Not linked to a project</option>
          {visibleProjects.map((project) => (
            <option key={project.id} value={project.id}>
              {project.name}
            </option>
          ))}
        </SelectInput>
      </div>
    </>
  );
}

/** Create or edit a recurring shoot schedule. */
export function ScheduleForm({
  clients,
  projects,
  lockedClientId,
  schedule,
}: {
  clients: ClientOption[];
  projects: ProjectOption[];
  lockedClientId?: string;
  schedule?: ShootSchedule;
}) {
  const [state, action] = useActionState(saveShootScheduleAction, initialState);
  const key = schedule?.id ?? "new-schedule";
  return (
    <form action={action} className="space-y-4">
      {schedule ? <input type="hidden" name="id" value={schedule.id} /> : null}
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="sm:col-span-2">
          <FieldLabel label="Schedule name" htmlFor={`${key}-title`} required />
          <TextInput id={`${key}-title`} name="title" required defaultValue={schedule?.title} placeholder="Monthly content shoot" />
        </div>
        <ClientAndProject
          clients={clients}
          projects={projects}
          lockedClientId={lockedClientId ?? schedule?.client_id}
          keyPrefix={key}
          defaultProject={schedule?.project_id}
        />
        <div>
          <FieldLabel label="How often" htmlFor={`${key}-frequency`} required />
          <SelectInput id={`${key}-frequency`} name="frequency" required defaultValue={schedule?.frequency ?? "monthly"}>
            {FREQUENCIES.map((value) => (
              <option key={value} value={value}>
                {value === "weekly" ? "Every week" : value === "biweekly" ? "Every other week" : "Once a month"}
              </option>
            ))}
          </SelectInput>
        </div>
        <div>
          <FieldLabel label="Day of the week" htmlFor={`${key}-weekday`} required />
          <SelectInput id={`${key}-weekday`} name="weekday" required defaultValue={String(schedule?.weekday ?? 2)}>
            {WEEKDAYS.map((name, index) => (
              <option key={name} value={index}>
                {name}
              </option>
            ))}
          </SelectInput>
        </div>
        <div>
          <FieldLabel label="Which one (monthly only)" htmlFor={`${key}-wom`} hint="e.g. first Tuesday" />
          <SelectInput id={`${key}-wom`} name="week_of_month" defaultValue={String(schedule?.week_of_month ?? 1)}>
            {Object.entries(WEEK_OF_MONTH_LABEL).map(([value, label]) => (
              <option key={value} value={value}>
                The {label} one
              </option>
            ))}
          </SelectInput>
        </div>
        <div>
          <FieldLabel label="Start time" htmlFor={`${key}-time`} />
          <TextInput id={`${key}-time`} name="start_time" type="time" defaultValue={trimTime(schedule?.start_time)} />
        </div>
        <div>
          <FieldLabel label="Length" htmlFor={`${key}-duration`} hint="minutes" />
          <TextInput id={`${key}-duration`} name="duration_minutes" type="number" min={15} max={1440} step={15} defaultValue={schedule?.duration_minutes ?? 120} />
        </div>
        <div>
          <FieldLabel label="Starts on" htmlFor={`${key}-starts`} />
          <TextInput id={`${key}-starts`} name="starts_on" type="date" defaultValue={schedule?.starts_on} />
        </div>
        <div>
          <FieldLabel label="Ends on" htmlFor={`${key}-ends`} hint="leave empty for no end" />
          <TextInput id={`${key}-ends`} name="ends_on" type="date" defaultValue={schedule?.ends_on} />
        </div>
        <div className="sm:col-span-2">
          <FieldLabel label="Location" htmlFor={`${key}-location`} />
          <TextInput id={`${key}-location`} name="location" defaultValue={schedule?.location} placeholder="Client's shop, 12 Market St, York" />
        </div>
        <div className="sm:col-span-2">
          <FieldLabel label="Checklist for every shoot" htmlFor={`${key}-checklist`} hint="one item per line" />
          <TextArea
            id={`${key}-checklist`}
            name="checklist"
            rows={4}
            defaultValue={checklistToText(schedule?.checklist)}
            placeholder={"Charge batteries\nConfirm shot list with client\nPack lights and mics\nCollect release forms"}
          />
        </div>
        <div className="sm:col-span-2">
          <FieldLabel label="Notes" htmlFor={`${key}-notes`} />
          <TextArea id={`${key}-notes`} name="notes" rows={2} defaultValue={schedule?.notes} />
        </div>
        {schedule ? (
          <label className="flex items-center gap-2 text-sm sm:col-span-2">
            <input type="checkbox" name="active" defaultChecked={schedule.active} /> Schedule is active
          </label>
        ) : null}
      </div>
      <div className="flex flex-wrap items-center gap-4">
        <SubmitButton pendingLabel="Saving…">{schedule ? "Save schedule" : "Create schedule and plan shoots"}</SubmitButton>
        <FormMessage {...state} />
      </div>
      <p className="text-xs text-muted-foreground">
        Saving plans the shoots for the next 90 days. Changing a schedule rebuilds upcoming shoots that are still &quot;planned&quot;; confirmed, shot and
        cancelled shoots are never touched.
      </p>
    </form>
  );
}

export function ScheduleActiveForm({ id, active }: { id: string; active: boolean }) {
  const [state, action] = useActionState(setShootScheduleActiveAction, initialState);
  return (
    <form action={action} className="flex items-center gap-3">
      <input type="hidden" name="id" value={id} />
      <input type="hidden" name="active" value={active ? "false" : "true"} />
      <SubmitButton pendingLabel="Saving…" className={quiet}>
        {active ? "Pause" : "Resume"}
      </SubmitButton>
      <FormMessage {...state} />
    </form>
  );
}

export function ExtendScheduleForm({ id, clientId }: { id: string; clientId: string }) {
  const [state, action] = useActionState(extendShootScheduleAction, initialState);
  return (
    <form action={action} className="flex items-center gap-3">
      <input type="hidden" name="id" value={id} />
      <input type="hidden" name="client_id" value={clientId} />
      <SubmitButton pendingLabel="Planning…" className={quiet}>
        Plan next 90 days
      </SubmitButton>
      <FormMessage {...state} />
    </form>
  );
}

/** A one-off shoot. */
export function NewShootForm({ clients, projects, lockedClientId }: { clients: ClientOption[]; projects: ProjectOption[]; lockedClientId?: string }) {
  const [state, action] = useActionState(createShootAction, initialState);
  return (
    <form action={action} className="space-y-4">
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="sm:col-span-2">
          <FieldLabel label="Shoot name" htmlFor="shoot-title" required />
          <TextInput id="shoot-title" name="title" required placeholder="Product launch shoot" />
        </div>
        <ClientAndProject clients={clients} projects={projects} lockedClientId={lockedClientId} keyPrefix="shoot-new" />
        <div>
          <FieldLabel label="Date" htmlFor="shoot-date" required />
          <TextInput id="shoot-date" name="shoot_date" type="date" required />
        </div>
        <div>
          <FieldLabel label="Start time" htmlFor="shoot-time" />
          <TextInput id="shoot-time" name="start_time" type="time" />
        </div>
        <div>
          <FieldLabel label="Length" htmlFor="shoot-duration" hint="minutes" />
          <TextInput id="shoot-duration" name="duration_minutes" type="number" min={15} max={1440} step={15} defaultValue={120} />
        </div>
        <div>
          <FieldLabel label="Location" htmlFor="shoot-location" />
          <TextInput id="shoot-location" name="location" />
        </div>
        <div className="sm:col-span-2">
          <FieldLabel label="Checklist" htmlFor="shoot-checklist" hint="one item per line" />
          <TextArea id="shoot-checklist" name="checklist" rows={3} />
        </div>
        <div className="sm:col-span-2">
          <FieldLabel label="Notes" htmlFor="shoot-notes" />
          <TextArea id="shoot-notes" name="notes" rows={2} />
        </div>
      </div>
      <div className="flex flex-wrap items-center gap-4">
        <SubmitButton pendingLabel="Adding…">Add shoot</SubmitButton>
        <FormMessage {...state} />
      </div>
    </form>
  );
}

/** Edit one occurrence. */
export function EditShootForm({ shoot }: { shoot: Shoot }) {
  const [state, action] = useActionState(updateShootAction, initialState);
  const key = shoot.id;
  return (
    <form action={action} className="space-y-4">
      <input type="hidden" name="id" value={shoot.id} />
      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <FieldLabel label="Status" htmlFor={`${key}-status`} required />
          <SelectInput id={`${key}-status`} name="status" required defaultValue={shoot.status}>
            {SHOOT_STATUSES.map((value) => (
              <option key={value} value={value}>
                {STATUS_LABEL[value]}
              </option>
            ))}
          </SelectInput>
        </div>
        <div>
          <FieldLabel label="Date" htmlFor={`${key}-date`} required />
          <TextInput id={`${key}-date`} name="shoot_date" type="date" required defaultValue={shoot.shoot_date} />
        </div>
        <div>
          <FieldLabel label="Start time" htmlFor={`${key}-time`} />
          <TextInput id={`${key}-time`} name="start_time" type="time" defaultValue={trimTime(shoot.start_time)} />
        </div>
        <div>
          <FieldLabel label="Length" htmlFor={`${key}-duration`} hint="minutes" />
          <TextInput id={`${key}-duration`} name="duration_minutes" type="number" min={15} max={1440} step={15} defaultValue={shoot.duration_minutes} />
        </div>
        <div className="sm:col-span-2">
          <FieldLabel label="Location" htmlFor={`${key}-location`} />
          <TextInput id={`${key}-location`} name="location" defaultValue={shoot.location} />
        </div>
        <div className="sm:col-span-2">
          <FieldLabel label="Notes" htmlFor={`${key}-notes`} />
          <TextArea id={`${key}-notes`} name="notes" rows={2} defaultValue={shoot.notes} />
        </div>
      </div>
      <div className="flex flex-wrap items-center gap-4">
        <SubmitButton pendingLabel="Saving…">Save shoot</SubmitButton>
        <FormMessage {...state} />
      </div>
    </form>
  );
}

/** One tick box in a shoot's checklist (a tiny form so it works without client state). */
export function ChecklistItemForm({ shootId, index, text, done }: { shootId: string; index: number; text: string; done: boolean }) {
  const [state, action] = useActionState(toggleShootChecklistAction, initialState);
  return (
    <form action={action}>
      <input type="hidden" name="id" value={shootId} />
      <input type="hidden" name="index" value={index} />
      <button type="submit" className="flex items-center gap-2 text-left text-sm hover:text-foreground" aria-pressed={done}>
        <span aria-hidden className={`inline-block size-4 shrink-0 rounded-sm border ${done ? "border-foreground bg-foreground text-background" : "border-border"}`}>
          {done ? <span className="block text-center text-[11px] leading-4">✓</span> : null}
        </span>
        <span className={done ? "text-muted-foreground line-through" : ""}>{text}</span>
      </button>
      {state.error ? <p className="mt-1 text-xs text-foreground">{state.error}</p> : null}
    </form>
  );
}
