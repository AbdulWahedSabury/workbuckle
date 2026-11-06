"use client";

import { useActionState } from "react";
import Link from "next/link";
import { initialActionState, type ActionState } from "@/lib/admin/action-state";
import { FormMessage, TextField } from "./fields";
import { useActionErrorToast } from "./useActionErrorToast";
import { SubmitButton } from "./buttons";
import { fieldsetClass, secondaryLinkClass } from "./styles";
import { defaultLocale } from "@/types/locale";
import LocalizedField from "./LocalizedField";

export type JobTypeFormValues = {
  name: string;
  slug: string;
  /** Saved translations keyed by form field name, e.g. { name_el: "…" }. */
  translations?: Record<string, string>;
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
  useActionErrorToast(state);
  // After a failed submit, show what was typed rather than the saved values.
  const v = state.values;
  const errors = state.errors ?? {};

  return (
    <form action={formAction} className="flex max-w-2xl flex-col gap-6">
      <FormMessage message={state.message} />

      <div className={fieldsetClass}>
        <LocalizedField label="Name" field="name" errors={errors} required>
          {(input) => (
            <TextField
              name={input.name}
              label={input.label}
              required={input.required}
              hideLabel
              placeholder={input.locale === defaultLocale ? "Full-time" : undefined}
              defaultValue={
                v ? v[input.name] : input.locale === defaultLocale ? jobType?.name : jobType?.translations?.[input.name]
              }
              error={errors[input.name]}
            />
          )}
        </LocalizedField>
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
