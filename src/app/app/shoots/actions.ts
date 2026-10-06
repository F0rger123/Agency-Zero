"use server";

import { revalidatePath } from "next/cache";
import { getUserClient, notFoundWhenNoRows } from "@/lib/actions";
import { field, optionalDate, optionalField, readableError, requiredText, type ActionState } from "@/lib/forms";
import {
  FREQUENCIES,
  SHOOTS_MIGRATION_MESSAGE,
  SHOOT_STATUSES,
  needsShootsMigration,
  parseChecklist,
  type ChecklistItem,
} from "@/lib/shoots";

const TIME = /^([01]\d|2[0-3]):[0-5]\d$/;

function shootError(message: string): string {
  return needsShootsMigration(message) ? SHOOTS_MIGRATION_MESSAGE : readableError(message);
}

function revalidateShoots(clientId?: string | null) {
  revalidatePath("/app/shoots");
  revalidatePath("/app/calendar");
  revalidatePath("/app");
  if (clientId) revalidatePath(`/app/clients/${clientId}`);
}

function optionalTime(formData: FormData, name: string): string | null | ActionState {
  const value = optionalField(formData, name);
  if (!value) return null;
  return TIME.test(value) ? value : { error: "Use a time like 10:00." };
}

function duration(formData: FormData): number | ActionState {
  const minutes = Number(field(formData, "duration_minutes") || 120);
  if (!Number.isInteger(minutes) || minutes < 15 || minutes > 1440) return { error: "Duration must be between 15 and 1440 minutes." };
  return minutes;
}

/** Create or edit a recurring schedule; the database saves it and builds the upcoming shoots in one transaction. */
export async function saveShootScheduleAction(_previous: ActionState, formData: FormData): Promise<ActionState> {
  const id = optionalField(formData, "id");
  const clientId = field(formData, "client_id");
  if (!clientId) return { error: "Choose a client." };
  const title = requiredText(formData, "title", "Schedule name", 160);
  if (typeof title !== "string") return title;
  const frequency = field(formData, "frequency") || "monthly";
  if (!(FREQUENCIES as readonly string[]).includes(frequency)) return { error: "Choose how often." };
  const weekday = Number(field(formData, "weekday"));
  if (!Number.isInteger(weekday) || weekday < 0 || weekday > 6) return { error: "Choose a weekday." };
  const weekOfMonth = frequency === "monthly" ? Number(field(formData, "week_of_month") || 1) : null;
  if (weekOfMonth !== null && (!Number.isInteger(weekOfMonth) || weekOfMonth < 1 || weekOfMonth > 5))
    return { error: "Choose which week of the month." };
  const time = optionalTime(formData, "start_time");
  if (time !== null && typeof time === "object") return time;
  const minutes = duration(formData);
  if (typeof minutes !== "number") return minutes;
  const startsOn = optionalDate(formData, "starts_on");
  const endsOn = optionalDate(formData, "ends_on");
  if (startsOn && endsOn && endsOn < startsOn) return { error: "The end date must be after the start date." };
  const location = optionalField(formData, "location");
  if (location && location.length > 300) return { error: "Location must be 300 characters or fewer." };

  const auth = await getUserClient();
  if ("error" in auth) return auth;
  const { data, error } = await auth.supabase.rpc("save_shoot_schedule", {
    p_id: id,
    p_data: {
      client_id: clientId,
      project_id: optionalField(formData, "project_id") ?? "",
      title,
      frequency,
      weekday,
      week_of_month: weekOfMonth ?? "",
      start_time: time ?? "",
      duration_minutes: minutes,
      location: location ?? "",
      checklist: parseChecklist(field(formData, "checklist")),
      notes: optionalField(formData, "notes") ?? "",
      starts_on: startsOn ?? "",
      ends_on: endsOn ?? "",
      ...(id ? { active: formData.get("active") === "on" } : {}),
    },
  });
  if (error) return { error: shootError(error.message) };
  revalidateShoots(clientId);
  const created = (data as { shoots_created?: number } | null)?.shoots_created ?? 0;
  return { success: id ? `Schedule saved. ${created} new upcoming shoot${created === 1 ? "" : "s"} planned.` : `Schedule created with ${created} upcoming shoot${created === 1 ? "" : "s"}.` };
}

/** Pause or resume. Pausing clears upcoming shoots that are still only "planned"; resuming rebuilds them. */
export async function setShootScheduleActiveAction(_previous: ActionState, formData: FormData): Promise<ActionState> {
  const id = field(formData, "id");
  const active = field(formData, "active") === "true";
  if (!id) return { error: "Schedule ID is missing." };
  const auth = await getUserClient();
  if ("error" in auth) return auth;
  const { data, error, count } = await auth.supabase
    .from("shoot_schedules")
    .update({ active }, { count: "exact" })
    .eq("id", id)
    .select("client_id")
    .maybeSingle();
  if (error) return { error: shootError(error.message) };
  const missing = notFoundWhenNoRows(count, "Schedule");
  if (missing) return missing;
  const generated = await auth.supabase.rpc("generate_shoots", { p_schedule_id: id, p_until: null, p_reset: true, p_from: null });
  if (generated.error) return { error: shootError(generated.error.message) };
  revalidateShoots(data?.client_id);
  return { success: active ? `Resumed. ${generated.data ?? 0} upcoming shoots planned.` : "Paused. Upcoming planned shoots were cleared (confirmed ones are kept)." };
}

/** Plan more shoots from an active schedule (the next 90 days). Safe to repeat; nothing is duplicated. */
export async function extendShootScheduleAction(_previous: ActionState, formData: FormData): Promise<ActionState> {
  const id = field(formData, "id");
  if (!id) return { error: "Schedule ID is missing." };
  const auth = await getUserClient();
  if ("error" in auth) return auth;
  const { data, error } = await auth.supabase.rpc("generate_shoots", { p_schedule_id: id, p_until: null, p_reset: false, p_from: null });
  if (error) return { error: shootError(error.message) };
  revalidateShoots(optionalField(formData, "client_id"));
  return { success: data ? `${data} new shoot${data === 1 ? "" : "s"} planned.` : "Already planned for the next 90 days." };
}

/** A single dated shoot that is not part of a schedule. */
export async function createShootAction(_previous: ActionState, formData: FormData): Promise<ActionState> {
  const clientId = field(formData, "client_id");
  if (!clientId) return { error: "Choose a client." };
  const title = requiredText(formData, "title", "Shoot name", 160);
  if (typeof title !== "string") return title;
  const date = optionalDate(formData, "shoot_date");
  if (!date) return { error: "Choose the shoot date." };
  const time = optionalTime(formData, "start_time");
  if (time !== null && typeof time === "object") return time;
  const minutes = duration(formData);
  if (typeof minutes !== "number") return minutes;
  const auth = await getUserClient();
  if ("error" in auth) return auth;
  const { error } = await auth.supabase.from("shoots").insert({
    client_id: clientId,
    project_id: optionalField(formData, "project_id"),
    title,
    shoot_date: date,
    start_time: time,
    duration_minutes: minutes,
    location: optionalField(formData, "location"),
    notes: optionalField(formData, "notes"),
    checklist: parseChecklist(field(formData, "checklist")).map((text) => ({ text, done: false })),
  });
  if (error) return { error: shootError(error.message) };
  revalidateShoots(clientId);
  return { success: "Shoot added." };
}

/** Edit one occurrence: move it, change status, add notes. Checklist ticks have their own action. */
export async function updateShootAction(_previous: ActionState, formData: FormData): Promise<ActionState> {
  const id = field(formData, "id");
  if (!id) return { error: "Shoot ID is missing." };
  const status = field(formData, "status") || "planned";
  if (!(SHOOT_STATUSES as readonly string[]).includes(status)) return { error: "Choose a valid status." };
  const date = optionalDate(formData, "shoot_date");
  if (!date) return { error: "Choose the shoot date." };
  const time = optionalTime(formData, "start_time");
  if (time !== null && typeof time === "object") return time;
  const minutes = duration(formData);
  if (typeof minutes !== "number") return minutes;
  const auth = await getUserClient();
  if ("error" in auth) return auth;
  const { data, error, count } = await auth.supabase
    .from("shoots")
    .update(
      {
        status,
        shoot_date: date,
        start_time: time,
        duration_minutes: minutes,
        location: optionalField(formData, "location"),
        notes: optionalField(formData, "notes"),
      },
      { count: "exact" },
    )
    .eq("id", id)
    .select("client_id")
    .maybeSingle();
  if (error) {
    if (error.code === "23505") return { error: "That schedule already has a shoot on this date." };
    return { error: shootError(error.message) };
  }
  const missing = notFoundWhenNoRows(count, "Shoot");
  if (missing) return missing;
  revalidateShoots(data?.client_id);
  return { success: "Shoot saved." };
}

/** Tick or untick one checklist item. */
export async function toggleShootChecklistAction(_previous: ActionState, formData: FormData): Promise<ActionState> {
  const id = field(formData, "id");
  const index = Number(field(formData, "index"));
  if (!id || !Number.isInteger(index) || index < 0) return { error: "Checklist item is missing." };
  const auth = await getUserClient();
  if ("error" in auth) return auth;
  const current = await auth.supabase.from("shoots").select("checklist, client_id").eq("id", id).maybeSingle();
  if (current.error) return { error: shootError(current.error.message) };
  if (!current.data) return { error: "Shoot not found." };
  const checklist = (Array.isArray(current.data.checklist) ? current.data.checklist : []) as ChecklistItem[];
  if (!checklist[index]) return { error: "Checklist item not found." };
  checklist[index] = { ...checklist[index], done: !checklist[index].done };
  const { error } = await auth.supabase.from("shoots").update({ checklist }).eq("id", id);
  if (error) return { error: shootError(error.message) };
  revalidateShoots(current.data.client_id);
  return {};
}

/** Delete one shoot. */
export async function deleteShootAction(_previous: ActionState, formData: FormData): Promise<ActionState> {
  const id = field(formData, "id");
  if (!id) return { error: "Shoot ID is missing." };
  const auth = await getUserClient();
  if ("error" in auth) return auth;
  const found = await auth.supabase.from("shoots").select("client_id").eq("id", id).maybeSingle();
  const { error, count } = await auth.supabase.from("shoots").delete({ count: "exact" }).eq("id", id);
  if (error) return { error: shootError(error.message) };
  const missing = notFoundWhenNoRows(count, "Shoot");
  if (missing) return missing;
  revalidateShoots(found.data?.client_id);
  return { success: "Shoot deleted." };
}

/** Delete a recurring schedule and the shoots it planned that have not happened yet. Past shoots stay as history. */
export async function deleteShootScheduleAction(_previous: ActionState, formData: FormData): Promise<ActionState> {
  const id = field(formData, "id");
  if (!id) return { error: "Schedule ID is missing." };
  const auth = await getUserClient();
  if ("error" in auth) return auth;
  const found = await auth.supabase.from("shoot_schedules").select("client_id").eq("id", id).maybeSingle();
  const planned = await auth.supabase.from("shoots").delete().eq("schedule_id", id).in("status", ["planned", "confirmed"]);
  if (planned.error) return { error: shootError(planned.error.message) };
  const { error, count } = await auth.supabase.from("shoot_schedules").delete({ count: "exact" }).eq("id", id);
  if (error) return { error: shootError(error.message) };
  const missing = notFoundWhenNoRows(count, "Schedule");
  if (missing) return missing;
  revalidateShoots(found.data?.client_id);
  return { success: "Schedule deleted." };
}
