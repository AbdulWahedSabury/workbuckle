"use client";

import { useActionState } from "react";
import Link from "next/link";
import { initialActionState, type ActionState } from "@/lib/admin/action-state";
import { CheckboxField, FormMessage, TextAreaField, TextField } from "./fields";
import { useActionErrorToast } from "./useActionErrorToast";
import { SubmitButton } from "./buttons";
import { fieldsetClass, legendClass, secondaryLinkClass } from "./styles";

export type FaqFormValues = {
  question: string;
  answer: string;
  isActive: boolean;
  sortOrder: number;
};

export default function FaqForm({
  action,
  faq,
  submitLabel,
}: {
  action: (state: ActionState, formData: FormData) => Promise<ActionState>;
  faq?: FaqFormValues;
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

      <fieldset className={fieldsetClass}>
        <legend className={legendClass}>Content</legend>
        <TextField
          name="question"
          label="Question"
          placeholder="How do I apply for a job?"
          required
          defaultValue={v ? v.question : faq?.question}
          error={errors.question}
        />
        <TextAreaField
          name="answer"
          label="Answer"
          rows={6}
          required
          hint="Plain text. Line breaks are kept on the site."
          defaultValue={v ? v.answer : faq?.answer}
          error={errors.answer}
        />
      </fieldset>

      <fieldset className={fieldsetClass}>
        <legend className={legendClass}>Display</legend>
        <TextField
          name="sortOrder"
          label="Sort order"
          type="number"
          hint="Lower numbers are shown first."
          defaultValue={v ? v.sortOrder : (faq?.sortOrder ?? 0)}
          error={errors.sortOrder}
        />
        <CheckboxField
          name="isActive"
          label="Visible on the site"
          hint="Shown in the FAQ section on the home and contact pages."
          defaultChecked={v ? v.isActive === "on" : (faq?.isActive ?? true)}
        />
      </fieldset>

      <div className="flex items-center gap-3">
        <SubmitButton>{submitLabel}</SubmitButton>
        <Link href="/admin/faqs" className={secondaryLinkClass}>
          Cancel
        </Link>
      </div>
    </form>
  );
}
