"use client";

import { useState } from "react";
import { AnimatedCheck } from "@/components/animated-check";
import { setTaskDoneAction } from "./actions";

export function TaskDoneToggle({ id, done: initial, title }: { id: string; done: boolean; title: string }) {
  const [done, setDone] = useState(initial);
  return (
    <AnimatedCheck
      checked={done}
      className="size-7"
      label={`${done ? "Mark not done" : "Mark done"}: ${title}`}
      onChange={async (next) => {
        setDone(next);
        const result = await setTaskDoneAction(id, next);
        if (result.error) setDone(!next);
      }}
    />
  );
}
