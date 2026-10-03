"use server";

import { revalidatePath } from "next/cache";
import { getUserClient, notFoundWhenNoRows } from "@/lib/actions";
import { field, optionalField, readableError, validHttpUrl, type ActionState } from "@/lib/forms";

const platforms = ["instagram", "facebook", "tiktok", "linkedin", "youtube", "x", "other"];
const formats = ["post", "reel", "story", "carousel", "video"];
const statuses = ["idea", "drafting", "scheduled", "posted"];

function refresh() {
  revalidatePath("/app/social");
}

function scheduledFor(formData: FormData): string | null | ActionState {
  const raw = field(formData, "scheduled_for");
  if (!raw) return null;
  const parsed = new Date(`${raw}:00Z`);
  if (Number.isNaN(parsed.getTime())) return { error: "Choose a valid date and time." };
  return parsed.toISOString();
}

export async function createPostAction(_previous: ActionState, formData: FormData): Promise<ActionState> {
  const clientId = field(formData, "client_id");
  if (!clientId) return { error: "Choose a client." };
  const platform = field(formData, "platform");
  const format = field(formData, "format");
  const status = field(formData, "status");
  if (!platforms.includes(platform)) return { error: "Choose a platform." };
  if (!formats.includes(format)) return { error: "Choose a format." };
  if (!statuses.includes(status)) return { error: "Choose a status." };
  const caption = optionalField(formData, "caption");
  if (caption && caption.length > 4000) return { error: "The caption must be 4000 characters or fewer." };
  const when = scheduledFor(formData);
  if (typeof when === "object" && when !== null) return when;
  const url = optionalField(formData, "post_url");
  if (!validHttpUrl(url)) return { error: "The post link must start with http:// or https://." };
  const auth = await getUserClient();
  if ("error" in auth) return auth;
  const { error } = await auth.supabase.from("social_posts").insert({
    client_id: clientId,
    platform,
    format,
    status,
    caption,
    scheduled_for: when,
    post_url: url,
    notes: optionalField(formData, "notes"),
  });
  if (error) return { error: readableError(error.message) };
  refresh();
  return { success: "Post added to the calendar." };
}

export async function updatePostStatusAction(_previous: ActionState, formData: FormData): Promise<ActionState> {
  const id = field(formData, "id");
  const status = field(formData, "status");
  if (!id) return { error: "Post ID is missing." };
  if (!statuses.includes(status)) return { error: "Choose a status." };
  const url = optionalField(formData, "post_url");
  if (!validHttpUrl(url)) return { error: "The post link must start with http:// or https://." };
  const auth = await getUserClient();
  if ("error" in auth) return auth;
  const { error, count } = await auth.supabase
    .from("social_posts")
    .update({ status, post_url: url }, { count: "exact" })
    .eq("id", id);
  if (error) return { error: readableError(error.message) };
  const missing = notFoundWhenNoRows(count, "Post");
  if (missing) return missing;
  refresh();
  return { success: "Post updated." };
}

export async function deletePostAction(_previous: ActionState, formData: FormData): Promise<ActionState> {
  const id = field(formData, "id");
  if (!id) return { error: "Post ID is missing." };
  const auth = await getUserClient();
  if ("error" in auth) return auth;
  const { error, count } = await auth.supabase.from("social_posts").delete({ count: "exact" }).eq("id", id);
  if (error) return { error: readableError(error.message) };
  const missing = notFoundWhenNoRows(count, "Post");
  if (missing) return missing;
  refresh();
  return { success: "Post removed." };
}
