"use client";

import { useActionState } from "react";
import Link from "next/link";
import { initialActionState, type ActionState } from "@/lib/admin/action-state";
import { FormMessage, TextAreaField, TextField } from "./fields";
import { useActionErrorToast } from "./useActionErrorToast";
import { SubmitButton } from "./buttons";
import ImageUploadField from "./ImageUploadField";
import { fieldsetClass, legendClass, secondaryLinkClass } from "./styles";

export type CampaignFormValues = {
  title: string;
  img: string | null;
  imageAlt: string | null;
  intro: string;
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
  const value = (field: keyof CampaignFormValues) => (v ? v[field] : campaign?.[field]);

  return (
    <form action={formAction} className="flex max-w-2xl flex-col gap-6">
      <FormMessage message={state.message} />

      <fieldset className={fieldsetClass}>
        <legend className={legendClass}>Content</legend>
        <TextField
          name="title"
          label="Title"
          placeholder="Front Office & Guest Experience"
          required
          defaultValue={value("title")}
          error={errors.title}
        />
        <TextAreaField
          name="intro"
          label="Intro"
          rows={5}
          required
          hint="A short paragraph about the roles in this campaign."
          defaultValue={value("intro")}
          error={errors.intro}
        />
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
        <TextField
          name="imageAlt"
          label="Image description (alt text)"
          placeholder="Hospitality team working together"
          hint="Read aloud by screen readers. Describe what the image shows."
          defaultValue={value("imageAlt")}
          error={errors.imageAlt}
        />
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
