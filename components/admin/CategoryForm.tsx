"use client";

import { useActionState } from "react";
import Link from "next/link";
import { initialActionState, type ActionState } from "@/lib/admin/action-state";
import { categoryNameField } from "@/schemas/AdminSchemas";
import { defaultLocale, locales } from "@/types/locale";
import { CheckboxField, FormMessage, TextField } from "./fields";
import { useActionErrorToast } from "./useActionErrorToast";
import { SubmitButton } from "./buttons";
import IconPickerField from "./IconPickerField";
import ImageUploadField from "./ImageUploadField";
import { fieldsetClass, legendClass, secondaryLinkClass } from "./styles";

const LOCALE_LABELS: Record<string, string> = { en: "English", de: "German" };

export type CategoryFormValues = {
  slug: string;
  imageUrl: string | null;
  icon: string | null;
  isActive: boolean;
  sortOrder: number;
  names: Partial<Record<string, string>>;
};

export default function CategoryForm({
  action,
  category,
  submitLabel,
}: {
  action: (state: ActionState, formData: FormData) => Promise<ActionState>;
  category?: CategoryFormValues;
  submitLabel: string;
}) {
  const [state, formAction] = useActionState(action, initialActionState);
  useActionErrorToast(state);
  const v = state.values;
  const errors = state.errors ?? {};
  const imageUrl = v ? v.existingImageUrl : category?.imageUrl;

  return (
    <form action={formAction} className="flex max-w-2xl flex-col gap-6">
      <FormMessage message={state.message} />

      <fieldset className={fieldsetClass}>
        <legend className={legendClass}>Name</legend>
        {locales.map((locale) => {
          const field = categoryNameField(locale);
          return (
            <TextField
              key={locale}
              name={field}
              label={LOCALE_LABELS[locale] ?? locale.toUpperCase()}
              required={locale === defaultLocale}
              hint={
                locale === defaultLocale
                  ? undefined
                  : `Optional. Falls back to ${LOCALE_LABELS[defaultLocale] ?? defaultLocale} when empty.`
              }
              defaultValue={v ? v[field] : category?.names[locale]}
              error={errors[field]}
            />
          );
        })}
      </fieldset>

      <fieldset className={fieldsetClass}>
        <legend className={legendClass}>Details</legend>
        <TextField
          name="slug"
          label="Slug"
          placeholder="software-engineering"
          hint="Used in URLs. Leave blank to generate it from the English name."
          defaultValue={v ? v.slug : category?.slug}
          error={errors.slug}
        />
        <IconPickerField
          name="icon"
          label="Icon"
          hint={
            <>
              Shown on the home page category cards. Browse every icon at{" "}
              <a href="https://lucide.dev/icons" target="_blank" rel="noreferrer" className="underline">
                lucide.dev/icons
              </a>
              .
            </>
          }
          defaultValue={v ? v.icon : category?.icon}
          error={errors.icon}
        />
        <ImageUploadField
          name="imageFile"
          label="Category image / icon"
          existingName="existingImageUrl"
          existingUrl={imageUrl}
          error={errors.imageUrl}
        />
        <TextField
          name="sortOrder"
          label="Sort order"
          type="number"
          hint="Lower numbers are shown first."
          defaultValue={v ? v.sortOrder : (category?.sortOrder ?? 0)}
          error={errors.sortOrder}
        />
        <CheckboxField
          name="isActive"
          label="Visible on the site"
          defaultChecked={
            v ? v.isActive === "on" : (category?.isActive ?? true)
          }
        />
      </fieldset>

      <div className="flex items-center gap-3">
        <SubmitButton>{submitLabel}</SubmitButton>
        <Link href="/admin/categories" className={secondaryLinkClass}>
          Cancel
        </Link>
      </div>
    </form>
  );
}
