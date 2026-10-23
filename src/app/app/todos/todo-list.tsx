"use client";

import { useState } from "react";
import { AnimatedCheck } from "@/components/animated-check";
import { ConfirmDelete } from "@/components/confirm-delete";
import { Icon } from "@/components/icons";
import { clearDoneTodosAction, deleteTodoAction, setTodoDoneAction, type Todo } from "./actions";
import { TodoQuickAdd } from "./todo-quick-add";

/** The To-do page: quick add on top, open items, then a collapsed "Done" list. Ticking and deleting update instantly and roll back if saving fails. */
export function TodoList({ initial }: { initial: Todo[] }) {
  const [todos, setTodos] = useState(initial);
  const [error, setError] = useState("");
  const open = todos.filter((todo) => !todo.done);
  const done = todos.filter((todo) => todo.done);

  const toggle = async (todo: Todo, next: boolean) => {
    setError("");
    setTodos((current) => current.map((item) => (item.id === todo.id ? { ...item, done: next } : item)));
    const result = await setTodoDoneAction(todo.id, next);
    if (result.error) {
      setError(result.error);
      setTodos((current) => current.map((item) => (item.id === todo.id ? { ...item, done: todo.done } : item)));
    }
  };
  const remove = async (todo: Todo) => {
    setError("");
    setTodos((current) => current.filter((item) => item.id !== todo.id));
    const result = await deleteTodoAction(todo.id);
    if (result.error) {
      setError(result.error);
      setTodos((current) => [todo, ...current]);
    }
  };

  return (
    <div className="space-y-8">
      <TodoQuickAdd autoFocus onAdded={(added) => setTodos((current) => [...added, ...current])} />
      {error ? <p role="alert" className="text-sm font-medium">{error}</p> : null}

      <section aria-label="To do">
        <h2 className="text-xs font-medium uppercase tracking-widest text-muted-foreground">
          To do <span className="text-faint-foreground">{open.length}</span>
        </h2>
        {open.length === 0 ? (
          <p className="mt-3 border-y border-border py-8 text-sm text-muted-foreground">
            {todos.length === 0 ? "Nothing here yet. Add the first thing above." : "All caught up."}
          </p>
        ) : (
          <ul className="mt-3 space-y-2">
            {open.map((todo) => (
              <Row key={todo.id} todo={todo} onToggle={(next) => toggle(todo, next)} onRemove={() => remove(todo)} />
            ))}
          </ul>
        )}
      </section>

      {done.length > 0 ? (
        <section aria-label="Done">
          <div className="flex items-center justify-between gap-3">
            <h2 className="text-xs font-medium uppercase tracking-widest text-muted-foreground">
              Done <span className="text-faint-foreground">{done.length}</span>
            </h2>
            <ConfirmDelete
              action={async (previous, formData) => {
                const result = await clearDoneTodosAction(previous, formData);
                if (result.success) setTodos((current) => current.filter((todo) => !todo.done));
                return result;
              }}
              fields={{}}
              label="Clear done"
              title="Clear all done items?"
              message="This permanently removes every ticked item. Items still to do are not touched."
              confirmLabel="Clear done"
            />
          </div>
          <ul className="mt-3 space-y-2">
            {done.map((todo) => (
              <Row key={todo.id} todo={todo} onToggle={(next) => toggle(todo, next)} onRemove={() => remove(todo)} />
            ))}
          </ul>
        </section>
      ) : null}
    </div>
  );
}

function Row({ todo, onToggle, onRemove }: { todo: Todo; onToggle: (next: boolean) => void; onRemove: () => void }) {
  const [flashing, setFlashing] = useState(false);
  return (
    <li
      className={`group flex items-start gap-3 rounded-xl border-[1.5px] px-4 py-3 transition-colors ${flashing ? "az-row-flash" : ""} ${todo.done ? "border-border text-muted-foreground" : "border-foreground/30 hover:border-foreground"}`}
    >
      <span className="mt-0.5">
        <AnimatedCheck
          checked={todo.done}
          label={`${todo.done ? "Mark not done" : "Mark done"}: ${todo.text}`}
          onChange={(next) => {
            if (next) {
              setFlashing(true);
              window.setTimeout(() => setFlashing(false), 900);
            }
            onToggle(next);
          }}
        />
      </span>
      <span className="min-w-0 flex-1 break-words text-base leading-7">
        <span data-done={todo.done} className="az-strike">{todo.text}</span>
      </span>
      <button type="button" aria-label={`Delete ${todo.text}`} onClick={onRemove} className="press -mr-1 rounded-md p-1.5 text-muted-foreground opacity-60 transition-opacity hover:bg-muted hover:text-foreground group-hover:opacity-100">
        <Icon name="close" className="size-4" />
      </button>
    </li>
  );
}
