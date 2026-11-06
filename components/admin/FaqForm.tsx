"use client";

import { useActionState } from "react";
import Link from "next/link";
import { initialActionState, type ActionState } from "@/lib/admin/action-state";
import { CheckboxField, FormMessage, TextAreaField, TextField } from "./fields";
import { useActionErrorToast } from "./useActionErrorToast";
import { SubmitButton } from "./buttons";
import { fieldsetClass, legendClass, secondaryLinkClass } from "./styles";
import { defaultLocale } from "@/types/locale";
import LocalizedField, { type LocalizedInput } from "./LocalizedField";

export type FaqFormValues = {
  question: string;
  answer: string;
  isActive: boolean;
  sortOrder: number;
  /** Saved translations keyed by form field name, e.g. { question_el: "…" }. */
  translations?: Record<string, string>;
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
  /** What the input shows: the typed value after a failed submit, else the saved English or translation. */
  const fieldValue = (input: LocalizedInput, english?: string) =>
    v ? v[input.name] : input.locale === defaultLocale ? english : faq?.translations?.[input.name];

  return (
    <form action={formAction} className="flex max-w-2xl flex-col gap-6">
      <FormMessage message={state.message} />

      <fieldset className={fieldsetClass}>
        <legend className={legendClass}>Content</legend>
        <LocalizedField label="Question" field="question" errors={errors} required>
          {(input) => (
            <TextField
              name={input.name}
              label={input.label}
              required={input.required}
              hideLabel
              placeholder={input.locale === defaultLocale ? "How do I apply for a job?" : undefined}
              defaultValue={fieldValue(input, faq?.question)}
              error={errors[input.name]}
            />
          )}
        </LocalizedField>
        <LocalizedField
          label="Answer"
          field="answer"
          errors={errors}
          required
          hint="Plain text. Line breaks are kept on the site."
        >
          {(input) => (
            <TextAreaField
              name={input.name}
              label={input.label}
              required={input.required}
              hideLabel
              rows={6}
              defaultValue={fieldValue(input, faq?.answer)}
              error={errors[input.name]}
            />
          )}
        </LocalizedField>
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
