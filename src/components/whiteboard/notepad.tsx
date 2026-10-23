"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { MicButton } from "@/components/mic-button";
import { applyDictation } from "@/lib/dictation-text";
import { useDictation } from "@/lib/use-dictation";
import { saveMeetingNotesAction, startBoardMeetingAction } from "@/app/app/meetings/actions";
import { recoverIfStale } from "@/lib/stale-build";
import { WbIcon } from "./wb-icons";

/** `scratchpad` is undefined while the database has no copy/paste notepad yet (before 0034). */
export type NotepadMeeting = { id: string; title: string; notes: string; scratchpad?: string };
type Field = "notes" | "scratchpad";
type Texts = Record<Field, string>;

/** Text typed just before an app update is kept here across the reload, then saved. */
const rescueKey = (id: string, field: Field) => (field === "notes" ? `az-notepad-${id}` : `az-notepad-${id}-pad`);

function rescued(meeting: NotepadMeeting | null, field: Field): string | null {
  if (!meeting || typeof window === "undefined") return null;
  try {
    return window.localStorage.getItem(rescueKey(meeting.id, field));
  } catch {
    return null;
  }
}

/**
 * The owner's private notepad beside the board, in two tabs: "Notes" (typed or dictated, the meeting record) and
 * "Notepad" (anything pasted during the meeting, kept separate). Both write to the meeting, never into the board,
 * which guests can see, so everything lands in the customer's file with the meeting.
 */
export function Notepad({
  boardId,
  meeting: initialMeeting,
  onClose,
  onMeeting,
}: {
  boardId: string;
  meeting: NotepadMeeting | null;
  onClose: () => void;
  onMeeting: (meeting: NotepadMeeting) => void;
}) {
  const [meeting, setMeeting] = useState(initialMeeting);
  const [tab, setTab] = useState<Field>("notes");
  const [texts, setTexts] = useState<Texts>(() => ({
    notes: rescued(initialMeeting, "notes") ?? initialMeeting?.notes ?? "",
    scratchpad: rescued(initialMeeting, "scratchpad") ?? initialMeeting?.scratchpad ?? "",
  }));
  const [status, setStatus] = useState<"saved" | "saving" | "error">("saved");
  const [problem, setProblem] = useState("");
  const [hint, setHint] = useState("");
  const [starting, setStarting] = useState(false);
  const latest = useRef(texts);
  const timers = useRef<Partial<Record<Field, number>>>({});
  const meetingRef = useRef(meeting);
  const hasPad = typeof meeting?.scratchpad === "string";

  useEffect(() => {
    meetingRef.current = meeting;
  });

  const save = async (field: Field) => {
    const target = meetingRef.current;
    if (!target) return;
    timers.current[field] = undefined;
    const value = latest.current[field];
    setStatus("saving");
    try {
      const result = await saveMeetingNotesAction(target.id, value, field);
      if (!result.ok) {
        setStatus("error");
        setProblem(result.error ?? "Could not save.");
        return;
      }
      onMeeting({ ...target, notes: latest.current.notes, ...(typeof target.scratchpad === "string" ? { scratchpad: latest.current.scratchpad } : {}) });
      try {
        window.localStorage.removeItem(rescueKey(target.id, field));
      } catch {
        // Nothing was stashed, or storage is blocked.
      }
      setStatus(latest.current[field] === value ? "saved" : "saving");
    } catch (error) {
      const stash = () => {
        try {
          window.localStorage.setItem(rescueKey(target.id, field), value);
        } catch {
          // Storage blocked: the reload below may lose the last few words.
        }
      };
      if (recoverIfStale(error, stash)) return;
      setStatus("error");
      setProblem("No connection. Your notes are still here; they save when you type again.");
    }
  };

  const change = (field: Field, value: string) => {
    latest.current = { ...latest.current, [field]: value };
    setTexts(latest.current);
    setStatus("saving");
    window.clearTimeout(timers.current[field]);
    timers.current[field] = window.setTimeout(() => void save(field), 800);
  };

  // Text rescued from before an update: send it now.
  useEffect(() => {
    const waiting = (["notes", "scratchpad"] as Field[]).filter((field) => rescued(initialMeeting, field) !== null);
    if (waiting.length === 0) return;
    const timer = window.setTimeout(() => waiting.forEach((field) => void save(field)), 300);
    return () => window.clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const dictation = useDictation((phrase) => change("notes", applyDictation(latest.current.notes, phrase)));

  // Leaving the board (or closing the pad) sends whatever is still waiting.
  useEffect(
    () => () => {
      for (const field of ["notes", "scratchpad"] as Field[]) {
        if (timers.current[field] !== undefined) {
          window.clearTimeout(timers.current[field]);
          void save(field);
        }
      }
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [],
  );

  const flash = (text: string) => {
    setHint(text);
    window.setTimeout(() => setHint(""), 1800);
  };
  const paste = async () => {
    try {
      const text = await navigator.clipboard.readText();
      if (!text) return flash("Clipboard is empty");
      const current = latest.current.scratchpad;
      change("scratchpad", current ? `${current.replace(/\s+$/, "")}\n${text}` : text);
      flash("Pasted");
    } catch {
      flash("Press and hold in the box, then Paste");
    }
  };
  const copy = async () => {
    try {
      await navigator.clipboard.writeText(latest.current[tab]);
      flash("Copied");
    } catch {
      flash("Select the text and copy it");
    }
  };

  const start = async () => {
    setStarting(true);
    setProblem("");
    const result = await startBoardMeetingAction(boardId).catch((error: unknown) => {
      recoverIfStale(error);
      return { ok: false as const, error: "No connection.", meeting: undefined };
    });
    setStarting(false);
    if (!result.ok || !result.meeting) {
      setProblem(result.error ?? "Could not start the meeting.");
      return;
    }
    setMeeting(result.meeting);
    onMeeting(result.meeting);
  };

  const showing: Field = hasPad ? tab : "notes";

  return (
    <aside
      aria-label="Meeting notepad"
      className="wb-rise absolute inset-x-2 top-[calc(6.25rem+env(safe-area-inset-top))] z-[19] flex h-[min(44dvh,24rem)] flex-col rounded-2xl border border-border bg-background shadow-2xl select-text md:inset-x-auto md:bottom-20 md:right-4 md:h-auto md:w-[22rem]"
      onPointerDown={(event) => event.stopPropagation()}
    >
      <div className="flex items-center gap-2 border-b border-border px-4 py-3">
        <WbIcon name="notepad" className="size-4 shrink-0" />
        <span className="min-w-0 flex-1">
          <span className="block text-sm font-semibold tracking-tight">Meeting</span>
          <span className="block truncate text-[11px] text-muted-foreground">
            {meeting ? (status === "saving" ? "Saving…" : status === "error" ? "Not saved" : "Saved to the meeting") : "Only you see this"}
          </span>
        </span>
        {meeting ? (
          <Link href={`/app/meetings/${meeting.id}`} className="rounded-full border border-border px-3 py-1 text-xs font-medium transition-colors hover:bg-muted">
            Open meeting
          </Link>
        ) : null}
        <button type="button" aria-label="Close notepad" onClick={onClose} className="wb-btn !size-8">
          <WbIcon name="close" className="size-4" />
        </button>
      </div>
      {meeting ? (
        <div className="flex min-h-0 flex-1 flex-col p-3">
          <div className="mb-2 flex items-center gap-1.5">
            {hasPad ? (
              <div role="tablist" aria-label="Notes or notepad" className="flex rounded-full bg-muted p-0.5 text-xs">
                {([["notes", "Notes"], ["scratchpad", "Notepad"]] as [Field, string][]).map(([key, label]) => (
                  <button key={key} type="button" role="tab" aria-selected={showing === key} onClick={() => setTab(key)} className={`rounded-full px-3 py-1 transition-colors ${showing === key ? "bg-background font-medium shadow-sm" : "text-muted-foreground"}`}>
                    {label}
                  </button>
                ))}
              </div>
            ) : null}
            <span className="ml-auto flex items-center gap-1.5">
              {hint ? <span role="status" className="text-[11px] text-muted-foreground">{hint}</span> : null}
              {showing === "scratchpad" ? (
                <button type="button" onClick={paste} className="rounded-full border border-border px-2.5 py-1 text-xs font-medium transition-colors hover:bg-muted">Paste</button>
              ) : null}
              <button type="button" onClick={copy} disabled={!texts[showing]} className="rounded-full border border-border px-2.5 py-1 text-xs font-medium transition-colors hover:bg-muted disabled:opacity-40">Copy</button>
            </span>
          </div>
          <div className="relative flex min-h-0 flex-1 flex-col">
            {showing === "notes" ? (
              <>
                <textarea
                  aria-label="Meeting notes"
                  value={texts.notes}
                  onChange={(event) => change("notes", event.target.value)}
                  placeholder="Type or dictate while you talk. Only you see this; the customer sees the board."
                  className="min-h-0 flex-1 resize-none rounded-xl bg-muted/60 p-3 pr-14 text-sm leading-6 outline-none focus:bg-muted"
                />
                <MicButton dictation={dictation} className="absolute right-3 top-3" />
              </>
            ) : (
              <textarea
                aria-label="Notepad"
                value={texts.scratchpad}
                onChange={(event) => change("scratchpad", event.target.value)}
                placeholder="Paste links, numbers or text here. Kept separate from the meeting notes."
                className="min-h-0 flex-1 resize-none rounded-xl bg-muted/60 p-3 font-mono text-[13px] leading-6 outline-none focus:bg-muted"
              />
            )}
          </div>
          {status === "error" ? <p className="mt-2 text-xs text-red-600">{problem}</p> : null}
        </div>
      ) : (
        <div className="flex flex-1 flex-col justify-center gap-3 p-5 text-sm">
          <p className="leading-6 text-muted-foreground">Notes live with a meeting, so they are saved to the customer&apos;s file. Guests on the shared link never see them.</p>
          <button type="button" disabled={starting} onClick={start} className="press rounded-xl bg-foreground py-2.5 text-sm font-medium text-background disabled:opacity-50">
            {starting ? "Starting…" : "Start meeting notes"}
          </button>
          {problem ? <p className="text-xs text-red-600">{problem}</p> : null}
        </div>
      )}
    </aside>
  );
}
