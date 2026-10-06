import { AddDialog } from "@/components/modal";
import type { Metadata } from "next";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { isMissingTable } from "@/lib/forms";
import { LIST_LIMIT, PICKER_LIMIT } from "@/lib/limits";
import { dateTimeLabel } from "@/lib/format";
import { PageHeader } from "@/components/page-header";
import { FormSection } from "@/components/form-controls";
import { DataFailure, MigrationsRequired, SetupRequired } from "@/components/states";
import { DeletePostForm, formatLabels, NewPostForm, platformLabels, PostStatusForm, statusLabels } from "./post-forms";

export const metadata: Metadata = { title: "Social" };

type Post = {
  id: string;
  client_id: string;
  platform: string;
  format: string;
  status: string;
  caption: string | null;
  scheduled_for: string | null;
  post_url: string | null;
  notes: string | null;
  clients: { name: string } | { name: string }[] | null;
};

const order = ["scheduled", "drafting", "idea", "posted"] as const;

/** Social: a content calendar per client and platform, from idea to posted. */
export default async function SocialPage() {
  if (!isSupabaseConfigured()) return <SetupRequired />;
  const supabase = await createClient();
  const [postsResponse, clientsResponse] = await Promise.all([
    supabase
      .from("social_posts")
      .select("id, client_id, platform, format, status, caption, scheduled_for, post_url, notes, clients(name)")
      .order("scheduled_for", { ascending: true, nullsFirst: false })
      .limit(LIST_LIMIT),
    supabase.from("clients").select("id, name, company").is("deleted_at", null).order("name").limit(PICKER_LIMIT),
  ]);
  const header = (
    <PageHeader
      title="Social"
      description="Plan content for each client and platform, and move it from idea to posted."
    />
  );
  if (postsResponse.error) {
    return (
      <>
        {header}
        {isMissingTable(postsResponse.error.message) ? (
          <MigrationsRequired detail="Social needs database update 0021 (supabase/scripts/apply)." />
        ) : (
          <DataFailure title="Social" message={postsResponse.error.message} />
        )}
      </>
    );
  }
  const posts = (postsResponse.data ?? []) as Post[];
  const clients = (clientsResponse.data ?? []) as { id: string; name: string; company: string | null }[];
  const count = (status: string) => posts.filter((post) => post.status === status).length;
  const weekAhead = new Date();
  weekAhead.setUTCDate(weekAhead.getUTCDate() + 7);
  const weekAheadIso = weekAhead.toISOString();
  const dueThisWeek = posts.filter(
    (post) => post.status === "scheduled" && post.scheduled_for !== null && post.scheduled_for <= weekAheadIso,
  ).length;

  return (
    <>
      {header}
      <ul className="grid grid-cols-2 gap-px border border-border bg-border lg:grid-cols-4">
        {[
          ["Going out this week", String(dueThisWeek)],
          ["Scheduled", String(count("scheduled"))],
          ["In progress", String(count("drafting") + count("idea"))],
          ["Posted", String(count("posted"))],
        ].map(([label, value]) => (
          <li key={label} className="bg-background p-6">
            <p className="text-2xl font-semibold tracking-tight">{value}</p>
            <p className="mt-2 text-[11px] font-medium uppercase tracking-widest text-muted-foreground">{label}</p>
          </li>
        ))}
      </ul>

      <div className="mt-8">
        <AddDialog label="New post" title="New post">
          <NewPostForm
            clients={clients.map((client) => ({ id: client.id, label: `${client.name}${client.company ? ` · ${client.company}` : ""}` }))}
          />
        </AddDialog>
      </div>

      <div className="mt-12 space-y-12">
        {order.map((status) => {
          const group = posts.filter((post) => post.status === status);
          if (group.length === 0) return null;
          return (
            <FormSection key={status} title={`${statusLabels[status]} (${group.length})`}>
              <ul className="divide-y divide-border border-y border-border">
                {group.map((post) => {
                  const client = Array.isArray(post.clients) ? post.clients[0] : post.clients;
                  return (
                    <li key={post.id}>
                      <details className="py-5">
                        <summary className="flex cursor-pointer list-none flex-wrap items-center justify-between gap-4">
                          <div className="min-w-0">
                            <p className="truncate font-medium">{post.caption?.split("\n")[0] || "Untitled post"}</p>
                            <p className="mt-1 text-sm text-muted-foreground">
                              <Link href={`/app/clients/${post.client_id}`} className="underline decoration-border underline-offset-4">
                                {client?.name ?? "Client"}
                              </Link>{" "}
                              · {platformLabels[post.platform] ?? post.platform} · {formatLabels[post.format] ?? post.format}
                            </p>
                          </div>
                          <span className="text-sm text-muted-foreground">
                            {post.scheduled_for ? dateTimeLabel(post.scheduled_for) : "No date"}
                          </span>
                        </summary>
                        {post.caption ? <p className="mt-4 whitespace-pre-wrap text-sm leading-6">{post.caption}</p> : null}
                        {post.notes ? <p className="mt-3 whitespace-pre-wrap text-sm leading-6 text-muted-foreground">{post.notes}</p> : null}
                        {post.post_url ? (
                          <p className="mt-3 text-sm">
                            <a href={post.post_url} target="_blank" rel="noreferrer" className="underline decoration-border underline-offset-4">
                              View live post ↗
                            </a>
                          </p>
                        ) : null}
                        <div className="mt-6 space-y-6">
                          <PostStatusForm id={post.id} status={post.status} postUrl={post.post_url} />
                          <DeletePostForm id={post.id} />
                        </div>
                      </details>
                    </li>
                  );
                })}
              </ul>
            </FormSection>
          );
        })}
        {posts.length === 0 ? (
          <p className="border-y border-border py-6 text-sm text-muted-foreground">Nothing planned yet.</p>
        ) : null}

      </div>
    </>
  );
}
