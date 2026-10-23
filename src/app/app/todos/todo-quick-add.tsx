"use client";

import { useRef, useState, useTransition } from "react";
import { DictationHint, MicButton } from "@/components/mic-button";
import { applyDictation } from "@/lib/dictation-text";
import { useDictation } from "@/lib/use-dictation";
import { addTodosAction, type Todo } from "./actions";

/**
 * One box to add to the to-do list, by keyboard or voice. Enter adds; saying "new line" between things adds several at once.
 * Used on the To-do page and inside Lock In.
 */
export function TodoQuickAdd({ onAdded, autoFocus = false, placeholder = "Add a to-do and press Enter" }: { onAdded: (todos: Todo[]) => void; autoFocus?: boolean; placeholder?: string }) {
  const [text, setText] = useState("");
  const [message, setMessage] = useState("");
  const [pending, startTransition] = useTransition();
  const input = useRef<HTMLTextAreaElement>(null);
  const dictation = useDictation((phrase) => setText((current) => applyDictation(current, phrase)));

  const submit = () => {
    const value = text.trim();
    if (!value || pending) return;
    dictation.stop();
    setMessage("");
    startTransition(async () => {
      const result = await addTodosAction(value);
      if (result.error) return setMessage(result.error);
      setText("");
      onAdded(result.todos);
      input.current?.focus();
    });
  };

  return (
    <div>
      <div className="flex items-start gap-2">
        <label htmlFor="todo-quick-add" className="sr-only">New to-do</label>
        <textarea
          id="todo-quick-add"
          ref={input}
          autoFocus={autoFocus}
          rows={1}
          value={text}
          maxLength={900}
          onChange={(event) => setText(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === "Enter" && !event.shiftKey) {
              event.preventDefault();
              submit();
            }
          }}
          placeholder={placeholder}
          className="min-h-11 w-full resize-y rounded-xl border-[1.5px] border-foreground/30 bg-background px-4 py-2.5 text-base outline-none transition-colors placeholder:text-faint-foreground focus:border-foreground"
        />
        <MicButton dictation={dictation} className="size-11" />
        <button
          type="button"
          onClick={submit}
          disabled={pending || !text.trim()}
          className="press h-11 shrink-0 rounded-xl bg-inverted px-5 text-sm font-medium text-inverted-foreground transition-opacity hover:opacity-85 disabled:opacity-40"
        >
          {pending ? "Adding…" : "Add"}
        </button>
      </div>
      {message ? <p role="alert" className="mt-2 text-sm font-medium">{message}</p> : null}
      <DictationHint dictation={dictation} className="mt-2" />
    </div>
  );
}
