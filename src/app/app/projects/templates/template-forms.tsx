"use client";

import { useActionState } from "react";
import { FieldLabel, FormMessage, SelectInput, SubmitButton, TextArea, TextInput } from "@/components/form-controls";
import type { ActionState } from "@/lib/forms";
import { SERVICE_KINDS, SERVICE_KIND_LABEL, templateToText } from "@/lib/phases";
import { saveProjectTemplateAction } from "./actions";

const initialState: ActionState = {};

export type TemplateRow = {
  id: string;
  name: string;
  service_kind: string;
  description: string | null;
  phases: unknown;
  active: boolean;
};

const EXAMPLE = "## Discovery\n- Kickoff call and goals | high | 0\n- Map the current workflow | | 3\n\n## Build\n- Build the first version | | 30";

export function TemplateForm({ template }: { template?: TemplateRow }) {
  const [state, action] = useActionState(saveProjectTemplateAction, initialState);
  const key = template?.id ?? "new-template";
  return (
    <form action={action} className="space-y-4">
      {template ? <input type="hidden" name="id" value={template.id} /> : null}
      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <FieldLabel label="Template name" htmlFor={`${key}-name`} required />
          <TextInput id={`${key}-name`} name="name" required defaultValue={template?.name} placeholder="Website build" />
        </div>
        <div>
          <FieldLabel label="For which service" htmlFor={`${key}-kind`} />
          <SelectInput id={`${key}-kind`} name="service_kind" defaultValue={template?.service_kind ?? "other"}>
            {SERVICE_KINDS.map((value) => (
              <option key={value} value={value}>
                {SERVICE_KIND_LABEL[value]}
              </option>
            ))}
          </SelectInput>
        </div>
        <div className="sm:col-span-2">
          <FieldLabel label="Description" htmlFor={`${key}-desc`} />
          <TextInput id={`${key}-desc`} name="description" defaultValue={template?.description} />
        </div>
        <div className="sm:col-span-2">
          <FieldLabel label="Phases and tasks" htmlFor={`${key}-phases`} hint="## Phase, then - task | priority | day" required />
          <TextArea id={`${key}-phases`} name="phases_text" rows={12} required defaultValue={template ? templateToText(template.phases) : EXAMPLE} />
        </div>
        {template ? (
          <label className="flex items-center gap-2 text-sm sm:col-span-2">
            <input type="hidden" name="active" value="off" />
            <input type="checkbox" name="active" value="on" defaultChecked={template.active} /> Offer this template on projects
          </label>
        ) : null}
      </div>
      <div className="flex flex-wrap items-center gap-4">
        <SubmitButton>{template ? "Save template" : "Create template"}</SubmitButton>
        <FormMessage {...state} />
      </div>
    </form>
  );
}
