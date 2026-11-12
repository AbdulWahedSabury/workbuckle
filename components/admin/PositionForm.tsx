"use client";

import { useActionState } from "react";
import Link from "next/link";
import { initialActionState, type ActionState } from "@/lib/admin/action-state";
import { FormMessage, TextField } from "./fields";
import { useActionErrorToast } from "./useActionErrorToast";
import { SubmitButton } from "./buttons";
import { fieldsetClass, secondaryLinkClass } from "./styles";

export type PositionFormValues = { name: string; slug: string };

export default function PositionForm({
  action,
  position,
  submitLabel,
}: {
  action: (state: ActionState, formData: FormData) => Promise<ActionState>;
  position?: PositionFormValues;
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
        <TextField
          name="name"
          label="Name"
          placeholder="Waiter"
          required
          defaultValue={v ? v.name : position?.name}
          error={errors.name}
        />
        <TextField
          name="slug"
          label="Slug"
          placeholder="waiter"
          hint="A short id for this position. Leave blank to generate it from the name."
          defaultValue={v ? v.slug : position?.slug}
          error={errors.slug}
        />
      </div>

      <div className="flex items-center gap-3">
        <SubmitButton>{submitLabel}</SubmitButton>
        <Link href="/admin/positions" className={secondaryLinkClass}>
          Cancel
        </Link>
      </div>
    </form>
  );
}
