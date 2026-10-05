import Link from "next/link";
import { FormSection } from "@/components/form-controls";
import { dateLabel } from "@/lib/format";
import { crmHref } from "@/lib/routes";
import { STATUS_LABEL, WEEKDAYS, checklistProgress, describeRule, durationLabel, timeLabel, type ChecklistItem, type ShootStatus } from "@/lib/shoots";
import {
  ChecklistItemForm,
  EditShootForm,
  ExtendScheduleForm,
  NewShootForm,
  ScheduleActiveForm,
  ScheduleForm,
  type ClientOption,
  type ProjectOption,
  type Shoot,
  type ShootSchedule,
} from "./shoot-forms";

export type ShootsOverview = {
  schedules: ShootSchedule[];
  upcoming: Shoot[];
  recent: (Omit<Shoot, "schedule_id" | "project_id" | "duration_minutes" | "checklist"> & { schedule_id?: never })[];
  client_options: ClientOption[];
  project_options: ProjectOption[];
};

function Empty({ children }: { children: React.ReactNode }) {
  return <p className="border-y border-border py-6 text-sm text-muted-foreground">{children}</p>;
}

function StatusBadge({ status }: { status: string }) {
  const muted = status === "cancelled" || status === "rescheduled";
  return (
    <span
      className={`rounded-full border px-2 py-0.5 text-[10px] font-medium uppercase tracking-widest ${
        status === "confirmed" ? "border-foreground text-foreground" : muted ? "border-border text-faint-foreground" : "border-border text-muted-foreground"
      }`}
    >
      {STATUS_LABEL[status as ShootStatus] ?? status}
    </span>
  );
}

const weekdayOf = (date: string) => WEEKDAYS[new Date(`${date}T00:00:00Z`).getUTCDay()];

/**
 * Recurring content shoots: upcoming shoots (with checklists), the schedules that generate them, and one-off shoots.
 * Used by the global /app/shoots page and the client workspace "Shoots" tab (`lockedClientId`).
 */
export function ShootsView({ data, lockedClientId }: { data: ShootsOverview; lockedClientId?: string }) {
  const { schedules, upcoming, recent, client_options: clients, project_options: projects } = data;
  const scoped = Boolean(lockedClientId);

  return (
    <div className="space-y-14">
      <section>
        <h2 className="text-xs font-medium uppercase tracking-widest text-muted-foreground">
          {upcoming.length} upcoming {upcoming.length === 1 ? "shoot" : "shoots"}
        </h2>
        {upcoming.length === 0 ? (
          <div className="mt-4">
            <Empty>
              {schedules.some((schedule) => schedule.active)
                ? "Nothing planned. Use “Plan next 90 days” on a schedule below."
                : "No shoots planned. Create a recurring schedule below, or add a one-off shoot."}
            </Empty>
          </div>
        ) : (
          <ul className="mt-4 divide-y divide-border border-y border-border">
            {upcoming.map((shoot) => {
              const progress = checklistProgress(shoot.checklist);
              const items = (Array.isArray(shoot.checklist) ? shoot.checklist : []) as ChecklistItem[];
              return (
                <li key={shoot.id} className="py-6">
                  <div className="flex flex-wrap items-start justify-between gap-4">
                    <div className="min-w-0">
                      <p className="text-xs uppercase tracking-widest text-muted-foreground">
                        {weekdayOf(shoot.shoot_date)} · {dateLabel(shoot.shoot_date)} · {timeLabel(shoot.start_time)} · {durationLabel(shoot.duration_minutes)}
                      </p>
                      <h3 className="mt-1 font-medium">{shoot.title}</h3>
                      <p className="mt-1 text-sm text-muted-foreground">
                        {!scoped ? (
                          <>
                            <Link href={crmHref(`/clients/${shoot.client_id}`)} className="underline decoration-border underline-offset-4">
                              {shoot.client_name}
                            </Link>
                            {" · "}
                          </>
                        ) : null}
                        {shoot.location || "Location TBC"}
                        {shoot.schedule_id ? " · recurring" : " · one-off"}
                      </p>
                      {shoot.notes ? <p className="mt-2 whitespace-pre-wrap text-sm leading-6">{shoot.notes}</p> : null}
                    </div>
                    <div className="flex items-center gap-3">
                      {progress.total > 0 ? (
                        <span className="text-xs text-muted-foreground">
                          {progress.done}/{progress.total} ready
                        </span>
                      ) : null}
                      <StatusBadge status={shoot.status} />
                    </div>
                  </div>
                  {items.length > 0 ? (
                    <div className="mt-4 grid gap-2 sm:grid-cols-2">
                      {items.map((item, index) => (
                        <ChecklistItemForm key={`${shoot.id}-${index}`} shootId={shoot.id} index={index} text={item.text} done={item.done} />
                      ))}
                    </div>
                  ) : null}
                  <details className="mt-4">
                    <summary className="cursor-pointer text-xs font-medium text-muted-foreground underline decoration-border underline-offset-4">
                      Reschedule, change status or add notes
                    </summary>
                    <div className="mt-4">
                      <EditShootForm shoot={shoot} />
                    </div>
                  </details>
                </li>
              );
            })}
          </ul>
        )}
      </section>

      <FormSection
        title="Recurring schedules"
        description="A schedule is the rule (for example “the first Tuesday of every month, 10:00, 2 hours”). Each one plans dated shoots for you."
      >
        {schedules.length === 0 ? (
          <Empty>No recurring schedules yet. Create the first one below.</Empty>
        ) : (
          <ul className="divide-y divide-border border-y border-border">
            {schedules.map((schedule) => (
              <li key={schedule.id} className="py-6">
                <div className="flex flex-wrap items-start justify-between gap-4">
                  <div className="min-w-0">
                    <h3 className="font-medium">
                      {schedule.title}
                      {!schedule.active ? <span className="ml-2 text-xs uppercase tracking-widest text-muted-foreground">paused</span> : null}
                    </h3>
                    <p className="mt-1 text-sm text-muted-foreground">{describeRule(schedule)}</p>
                    <p className="mt-1 text-sm text-muted-foreground">
                      {!scoped ? `${schedule.client_name} · ` : ""}
                      {schedule.location || "Location TBC"} · next shoot {schedule.next_shoot ? dateLabel(schedule.next_shoot) : "none planned"}
                      {schedule.generated_through ? ` · planned through ${dateLabel(schedule.generated_through)}` : ""}
                      {schedule.ends_on ? ` · ends ${dateLabel(schedule.ends_on)}` : ""}
                    </p>
                  </div>
                  <div className="flex flex-wrap items-center gap-5">
                    {schedule.active ? <ExtendScheduleForm id={schedule.id} clientId={schedule.client_id} /> : null}
                    <ScheduleActiveForm id={schedule.id} active={schedule.active} />
                  </div>
                </div>
                <details className="mt-4">
                  <summary className="cursor-pointer text-xs font-medium text-muted-foreground underline decoration-border underline-offset-4">Edit schedule</summary>
                  <div className="mt-4">
                    <ScheduleForm clients={clients} projects={projects} lockedClientId={lockedClientId} schedule={schedule} />
                  </div>
                </details>
              </li>
            ))}
          </ul>
        )}
      </FormSection>

      <FormSection title="New recurring schedule" description="Weekly, every other week, or the Nth weekday of the month. Saving plans the next 90 days of shoots.">
        <ScheduleForm clients={clients} projects={projects} lockedClientId={lockedClientId} />
      </FormSection>

      <FormSection title="Add a one-off shoot" description="For a launch, event or anything that is not part of a recurring schedule.">
        <NewShootForm clients={clients} projects={projects} lockedClientId={lockedClientId} />
      </FormSection>

      {recent.length > 0 ? (
        <section>
          <h2 className="text-xs font-medium uppercase tracking-widest text-muted-foreground">Recent and closed shoots</h2>
          <ul className="mt-4 divide-y divide-border border-y border-border text-sm">
            {recent.map((shoot) => (
              <li key={shoot.id} className="flex flex-wrap items-center justify-between gap-3 py-3">
                <span>
                  {dateLabel(shoot.shoot_date)} · {shoot.title}
                  {!scoped ? <span className="text-muted-foreground"> · {shoot.client_name}</span> : null}
                </span>
                <StatusBadge status={shoot.status} />
              </li>
            ))}
          </ul>
        </section>
      ) : null}
    </div>
  );
}
