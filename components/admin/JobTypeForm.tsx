"use client";

import { useActionState } from "react";
import Link from "next/link";
import { initialActionState, type ActionState } from "@/lib/admin/action-state";
import { FormMessage, TextField } from "./fields";
import { SubmitButton } from "./buttons";
import { fieldsetClass, secondaryLinkClass } from "./styles";

export type JobTypeFormValues = {
  name: string;
  slug: string;
};

export default function JobTypeForm({
  action,
  jobType,
  submitLabel,
}: {
  action: (state: ActionState, formData: FormData) => Promise<ActionState>;
  jobType?: JobTypeFormValues;
  submitLabel: string;
}) {
  const [state, formAction] = useActionState(action, initialActionState);
  // After a failed submit, show what was typed rather than the saved values.
  const v = state.values;
  const errors = state.errors ?? {};

  return (
    <form action={formAction} className="flex max-w-2xl flex-col gap-6">
      <FormMessage message={state.message} />

      <div className={fieldsetClass}>
        <TextField
          name="name"
          label="Name"
          placeholder="Full-time"
          required
          defaultValue={v ? v.name : jobType?.name}
          error={errors.name}
        />
        <TextField
          name="slug"
          label="Slug"
          placeholder="full-time"
          hint="Used in URLs and filters. Leave blank to generate it from the name."
          defaultValue={v ? v.slug : jobType?.slug}
          error={errors.slug}
        />
      </div>

      <div className="flex items-center gap-3">
        <SubmitButton>{submitLabel}</SubmitButton>
        <Link href="/admin/job-types" className={secondaryLinkClass}>
          Cancel
        </Link>
      </div>
    </form>
  );
}
