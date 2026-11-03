"use client";

import { useActionState } from "react";
import Link from "next/link";
import { initialActionState, type ActionState } from "@/lib/admin/action-state";
import { FormMessage, TextField } from "./fields";
import { useActionErrorToast } from "./useActionErrorToast";
import { SubmitButton } from "./buttons";
import { fieldsetClass, secondaryLinkClass } from "./styles";

export default function ClientForm({ action, client, submitLabel }: {
  action: (state: ActionState, formData: FormData) => Promise<ActionState>;
  client?: { name: string; email: string | null; phone: string | null };
  submitLabel: string;
}) {
  const [state, formAction] = useActionState(action, initialActionState);
  useActionErrorToast(state);
  const values = state.values;
  const errors = state.errors ?? {};
  return (
    <form action={formAction} className="flex max-w-2xl flex-col gap-6">
      <FormMessage message={state.message} />
      <fieldset className={fieldsetClass}>
        <TextField name="name" label="Client name" required defaultValue={values ? values.name : client?.name} error={errors.name} />
        <TextField name="email" label="Email" type="email" autoComplete="email" defaultValue={values ? values.email : client?.email} error={errors.email} />
        <TextField name="phone" label="Phone" type="tel" autoComplete="tel" defaultValue={values ? values.phone : client?.phone} error={errors.phone} />
      </fieldset>
      <div className="flex items-center gap-3">
        <SubmitButton>{submitLabel}</SubmitButton>
        <Link href="/admin/clients" className={secondaryLinkClass}>Cancel</Link>
      </div>
    </form>
  );
}
