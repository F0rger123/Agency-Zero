"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { MicButton } from "@/components/mic-button";
import { applyDictation } from "@/lib/dictation-text";
import { useDictation } from "@/lib/use-dictation";
import { saveMeetingNotesAction, startBoardMeetingAction } from "@/app/app/meetings/actions";
import { recoverIfStale } from "@/lib/stale-build";
import { WbIcon } from "./wb-icons";

export type NotepadMeeting = { id: string; title: string; notes: string };

/** Notes typed just before an app update are kept here across the reload, then saved. */
const rescueKey = (id: string) => `az-notepad-${id}`;

function rescued(meeting: NotepadMeeting | null): string | null {
  if (!meeting || typeof window === "undefined") return null;
  try {
    return window.localStorage.getItem(rescueKey(meeting.id));
  } catch {
    return null;
  }
}

/**
 * The owner's private notepad beside the board. It writes into the meeting's notes (never into the board,
 * which guests can see), so whatever is typed here lands in the customer's file with the meeting.
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
  const [notes, setNotes] = useState(() => rescued(initialMeeting) ?? initialMeeting?.notes ?? "");
  const [status, setStatus] = useState<"saved" | "saving" | "error">("saved");
  const [problem, setProblem] = useState("");
  const [starting, setStarting] = useState(false);
  const latest = useRef(notes);
  const timer = useRef<number | undefined>(undefined);
  const meetingRef = useRef(meeting);

  useEffect(() => {
    latest.current = notes;
    meetingRef.current = meeting;
  });

  const save = async () => {
    const target = meetingRef.current;
    if (!target) return;
    const value = latest.current;
    setStatus("saving");
    try {
      const result = await saveMeetingNotesAction(target.id, value);
      if (!result.ok) {
        setStatus("error");
        setProblem(result.error ?? "Could not save.");
        return;
      }
      onMeeting({ ...target, notes: value });
      try {
        window.localStorage.removeItem(rescueKey(target.id));
      } catch {
        // Nothing was stashed, or storage is blocked.
      }
      setStatus(latest.current === value ? "saved" : "saving");
    } catch (error) {
      const stash = () => {
        try {
          window.localStorage.setItem(rescueKey(target.id), value);
        } catch {
          // Storage blocked: the reload below may lose the last few words.
        }
      };
      if (recoverIfStale(error, stash)) return;
      setStatus("error");
      setProblem("No connection. Your notes are still here; they save when you type again.");
    }
  };

  const change = (value: string) => {
    latest.current = value;
    setNotes(value);
    setStatus("saving");
    window.clearTimeout(timer.current);
    timer.current = window.setTimeout(save, 800);
  };

  // Notes rescued from before an update: send them now.
  useEffect(() => {
    if (!initialMeeting || rescued(initialMeeting) === null) return;
    const timer = window.setTimeout(() => void save(), 300);
    return () => window.clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const dictation = useDictation((phrase) => change(applyDictation(latest.current, phrase)));

  // Leaving the board (or closing the pad) sends whatever is still waiting.
  useEffect(
    () => () => {
      if (timer.current !== undefined) {
        window.clearTimeout(timer.current);
        void save();
      }
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [],
  );

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

  return (
    <aside
      aria-label="Meeting notepad"
      className="wb-rise absolute inset-x-2 top-[calc(6.25rem+env(safe-area-inset-top))] z-[19] flex h-[min(40dvh,22rem)] flex-col rounded-2xl border border-border bg-background shadow-2xl select-text md:inset-x-auto md:bottom-20 md:right-4 md:h-auto md:w-[22rem]"
      onPointerDown={(event) => event.stopPropagation()}
    >
      <div className="flex items-center gap-2 border-b border-border px-4 py-3">
        <WbIcon name="notepad" className="size-4 shrink-0" />
        <span className="min-w-0 flex-1">
          <span className="block text-sm font-semibold tracking-tight">Meeting notes</span>
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
        <div className="relative flex min-h-0 flex-1 flex-col p-3">
          <textarea
            aria-label="Meeting notes"
            value={notes}
            onChange={(event) => change(event.target.value)}
            placeholder="Type or dictate while you talk. Only you see this; the customer sees the board."
            className="min-h-0 flex-1 resize-none rounded-xl bg-muted/60 p-3 pr-14 text-sm leading-6 outline-none focus:bg-muted"
          />
          <MicButton dictation={dictation} className="absolute right-6 top-6" />
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
