"use server";

import { revalidatePath } from "next/cache";
import { getUserClient } from "@/lib/actions";
import { field, readableError, type ActionState } from "@/lib/forms";

function hoursToMinutes(raw: string, label: string): number | ActionState {
  const hours = Number(raw);
  if (!Number.isFinite(hours) || hours < 0 || hours > 24) return { error: `${label} must be between 0 and 24 hours.` };
  return Math.round(hours * 60);
}
export async function saveWeeklyCapacityAction(_previous: ActionState, formData: FormData): Promise<ActionState> {
  const rows: { weekday: number; available_minutes: number }[] = [];
  for (let day = 0; day < 7; day += 1) {
    const parsed = hoursToMinutes(field(formData, `capacity_${day}`), `Day ${day + 1}`);
    if (typeof parsed !== "number") return parsed;
    rows.push({ weekday: day, available_minutes: parsed });
  }
  const auth = await getUserClient();
  if ("error" in auth) return auth;
  const { error } = await auth.supabase.from("weekly_capacity").upsert(rows, { onConflict: "weekday" });
  if (error) return { error: readableError(error.message) };
  revalidatePath("/app/workload");
  revalidatePath("/app/calendar");
  return { success: "Weekly capacity saved." };
}
export async function saveDateCapacityAction(_previous: ActionState, formData: FormData): Promise<ActionState> {
  const date = field(formData, "date");
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) return { error: "Choose a valid date." };
  const parsed = hoursToMinutes(field(formData, "hours"), "Capacity");
  if (typeof parsed !== "number") return parsed;
  const auth = await getUserClient();
  if ("error" in auth) return auth;
  const { error } = await auth.supabase
    .from("workday_capacity")
    .upsert({ date, available_minutes: parsed }, { onConflict: "date" });
  if (error) return { error: readableError(error.message) };
  revalidatePath("/app/workload");
  revalidatePath("/app/calendar");
  return { success: "Date capacity saved." };
}
export async function deleteDateCapacityAction(_previous: ActionState, formData: FormData): Promise<ActionState> {
  const date = field(formData, "date");
  if (!date) return { error: "Date is missing." };
  const auth = await getUserClient();
  if ("error" in auth) return auth;
  const { error } = await auth.supabase.from("workday_capacity").delete().eq("date", date);
  if (error) return { error: readableError(error.message) };
  revalidatePath("/app/workload");
  revalidatePath("/app/calendar");
  return { success: "Date override removed." };
}
