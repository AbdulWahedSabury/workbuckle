"use client";

import { useActionState } from "react";
import Link from "next/link";
import { initialActionState, type ActionState } from "@/lib/admin/action-state";
import { FormMessage, TextField } from "./fields";
import { SubmitButton } from "./buttons";
import { fieldsetClass, secondaryLinkClass } from "./styles";

export type CityFormValues = {
  name: string;
  slug: string;
  state: string | null;
};

export default function CityForm({
  action,
  city,
  submitLabel,
}: {
  action: (state: ActionState, formData: FormData) => Promise<ActionState>;
  city?: CityFormValues;
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
          required
          defaultValue={v ? v.name : city?.name}
          error={errors.name}
        />
        <TextField
          name="slug"
          label="Slug"
          placeholder="limassol"
          hint="Used in URLs. Leave blank to generate it from the name."
          defaultValue={v ? v.slug : city?.slug}
          error={errors.slug}
        />
        <TextField
          name="state"
          label="State / region"
          defaultValue={v ? v.state : city?.state}
          error={errors.state}
        />
      </div>

      <div className="flex items-center gap-3">
        <SubmitButton>{submitLabel}</SubmitButton>
        <Link href="/admin/cities" className={secondaryLinkClass}>
          Cancel
        </Link>
      </div>
    </form>
  );
}
