"use client";

import { useActionState } from "react";
import type { ActionState } from "@/lib/forms";
import { FieldLabel, FormMessage, SelectInput, SubmitButton, TextArea, TextInput } from "@/components/form-controls";
import { createPostAction, deletePostAction, updatePostStatusAction } from "./actions";

const initialState: ActionState = {};

export const platformLabels: Record<string, string> = {
  instagram: "Instagram",
  facebook: "Facebook",
  tiktok: "TikTok",
  linkedin: "LinkedIn",
  youtube: "YouTube",
  x: "X",
  other: "Other",
};
export const formatLabels: Record<string, string> = { post: "Post", reel: "Reel", story: "Story", carousel: "Carousel", video: "Video" };
export const statusLabels: Record<string, string> = { idea: "Idea", drafting: "Drafting", scheduled: "Scheduled", posted: "Posted" };

export function NewPostForm({ clients }: { clients: { id: string; label: string }[] }) {
  const [state, action] = useActionState(createPostAction, initialState);
  return (
    <form action={action} className="space-y-5">
      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <FieldLabel label="Client" htmlFor="post-client" required />
          <SelectInput id="post-client" name="client_id" required>
            <option value="">Choose a client</option>
            {clients.map((client) => (
              <option key={client.id} value={client.id}>{client.label}</option>
            ))}
          </SelectInput>
        </div>
        <div>
          <FieldLabel label="Platform" htmlFor="post-platform" required />
          <SelectInput id="post-platform" name="platform" required defaultValue="instagram">
            {Object.entries(platformLabels).map(([value, label]) => (
              <option key={value} value={value}>{label}</option>
            ))}
          </SelectInput>
        </div>
        <div>
          <FieldLabel label="Format" htmlFor="post-format" required />
          <SelectInput id="post-format" name="format" required defaultValue="post">
            {Object.entries(formatLabels).map(([value, label]) => (
              <option key={value} value={value}>{label}</option>
            ))}
          </SelectInput>
        </div>
        <div>
          <FieldLabel label="Status" htmlFor="post-status" required />
          <SelectInput id="post-status" name="status" required defaultValue="idea">
            {Object.entries(statusLabels).map(([value, label]) => (
              <option key={value} value={value}>{label}</option>
            ))}
          </SelectInput>
        </div>
        <div>
          <FieldLabel label="Scheduled for" htmlFor="post-when" hint="optional" />
          <TextInput id="post-when" name="scheduled_for" type="datetime-local" />
        </div>
        <div>
          <FieldLabel label="Post link" htmlFor="post-url" hint="after it is live" />
          <TextInput id="post-url" name="post_url" type="url" placeholder="https://" />
        </div>
      </div>
      <div>
        <FieldLabel label="Caption or idea" htmlFor="post-caption" />
        <TextArea id="post-caption" name="caption" rows={4} placeholder="Before and after of the driveway clean, with the price and a call to action" />
      </div>
      <div>
        <FieldLabel label="Notes" htmlFor="post-notes" hint="shot list, hashtags, approvals" />
        <TextArea id="post-notes" name="notes" rows={2} />
      </div>
      <div className="flex flex-wrap items-center gap-4">
        <SubmitButton>Add post</SubmitButton>
        <FormMessage {...state} />
      </div>
    </form>
  );
}

export function PostStatusForm({ id, status, postUrl }: { id: string; status: string; postUrl: string | null }) {
  const [state, action] = useActionState(updatePostStatusAction, initialState);
  return (
    <form action={action} className="flex flex-wrap items-end gap-3">
      <input type="hidden" name="id" value={id} />
      <div>
        <FieldLabel label="Status" htmlFor={`post-status-${id}`} />
        <SelectInput id={`post-status-${id}`} name="status" defaultValue={status}>
          {Object.entries(statusLabels).map(([value, label]) => (
            <option key={value} value={value}>{label}</option>
          ))}
        </SelectInput>
      </div>
      <div className="min-w-56 flex-1">
        <FieldLabel label="Post link" htmlFor={`post-link-${id}`} />
        <TextInput id={`post-link-${id}`} name="post_url" type="url" defaultValue={postUrl} placeholder="https://" />
      </div>
      <SubmitButton pendingLabel="Saving…">Save</SubmitButton>
      <FormMessage {...state} />
    </form>
  );
}

export function DeletePostForm({ id }: { id: string }) {
  const [state, action] = useActionState(deletePostAction, initialState);
  return (
    <form action={action} className="flex flex-wrap items-center gap-3">
      <input type="hidden" name="id" value={id} />
      <SubmitButton pendingLabel="Removing…" className="bg-background text-xs">Remove post</SubmitButton>
      <FormMessage {...state} />
    </form>
  );
}
