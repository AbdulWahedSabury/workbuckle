"use client";

import { useActionState } from "react";
import Link from "next/link";
import { initialActionState, type ActionState } from "@/lib/admin/action-state";
import { FormMessage, TextAreaField, TextField } from "./fields";
import { useActionErrorToast } from "./useActionErrorToast";
import { SubmitButton } from "./buttons";
import ImageUploadField from "./ImageUploadField";
import { fieldsetClass, legendClass, secondaryLinkClass } from "./styles";
import { defaultLocale } from "@/types/locale";
import LocalizedField, { type LocalizedInput } from "./LocalizedField";

export type CampaignFormValues = {
  title: string;
  img: string | null;
  imageAlt: string | null;
  intro: string;
  /** Saved translations keyed by form field name, e.g. { title_el: "…" }. */
  translations?: Record<string, string>;
};

export default function CampaignForm({
  action,
  campaign,
  submitLabel,
}: {
  action: (state: ActionState, formData: FormData) => Promise<ActionState>;
  campaign?: CampaignFormValues;
  submitLabel: string;
}) {
  const [state, formAction] = useActionState(action, initialActionState);
  useActionErrorToast(state);
  // After a failed submit, show what was typed rather than the saved values.
  const v = state.values;
  const errors = state.errors ?? {};
  const value = (field: Exclude<keyof CampaignFormValues, "translations">) =>
    v ? v[field] : campaign?.[field];
  /** What the input shows: the typed value after a failed submit, else the saved English or translation. */
  const fieldValue = (input: LocalizedInput, english?: string | null) =>
    v ? v[input.name] : input.locale === defaultLocale ? english : campaign?.translations?.[input.name];

  return (
    <form action={formAction} className="flex max-w-2xl flex-col gap-6">
      <FormMessage message={state.message} />

      <fieldset className={fieldsetClass}>
        <legend className={legendClass}>Content</legend>
        <LocalizedField label="Title" field="title" errors={errors} required>
          {(input) => (
            <TextField
              name={input.name}
              label={input.label}
              required={input.required}
              hideLabel
              placeholder={input.locale === defaultLocale ? "Front Office & Guest Experience" : undefined}
              defaultValue={fieldValue(input, campaign?.title)}
              error={errors[input.name]}
            />
          )}
        </LocalizedField>
        <LocalizedField
          label="Intro"
          field="intro"
          errors={errors}
          required
          hint="A short paragraph about the roles in this campaign."
        >
          {(input) => (
            <TextAreaField
              name={input.name}
              label={input.label}
              required={input.required}
              hideLabel
              rows={5}
              defaultValue={fieldValue(input, campaign?.intro)}
              error={errors[input.name]}
            />
          )}
        </LocalizedField>
      </fieldset>

      <fieldset className={fieldsetClass}>
        <legend className={legendClass}>Image</legend>
        <ImageUploadField
          name="imgFile"
          label="Upload an image"
          existingUrl={value("img")}
          error={errors.imgFile}
        />
        <TextField
          name="img"
          label="Or image path / URL"
          placeholder="/images/available/front-desk.jpg"
          hint="A path under /public or a full https:// URL. An uploaded file replaces this."
          defaultValue={value("img")}
          error={errors.img}
        />
        <LocalizedField
          label="Image description (alt text)"
          field="imageAlt"
          errors={errors}
          hint="Read aloud by screen readers. Describe what the image shows."
        >
          {(input) => (
            <TextField
              name={input.name}
              label={input.label}
              hideLabel
              placeholder={input.locale === defaultLocale ? "Hospitality team working together" : undefined}
              defaultValue={fieldValue(input, campaign?.imageAlt)}
              error={errors[input.name]}
            />
          )}
        </LocalizedField>
      </fieldset>

      <div className="flex items-center gap-3">
        <SubmitButton>{submitLabel}</SubmitButton>
        <Link href="/admin/campaigns" className={secondaryLinkClass}>
          Cancel
        </Link>
      </div>
    </form>
  );
}
