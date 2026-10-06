"use client";

import { useActionState } from "react";
import Link from "next/link";
import { initialActionState, type ActionState } from "@/lib/admin/action-state";
import { categoryNameField } from "@/schemas/AdminSchemas";
import { defaultLocale, locales } from "@/types/locale";
import { CheckboxField, FormMessage, TextField } from "./fields";
import { SubmitButton } from "./buttons";
import { fieldsetClass, legendClass, secondaryLinkClass } from "./styles";

const LOCALE_LABELS: Record<string, string> = { en: "English", de: "German" };

export type CategoryFormValues = {
  slug: string;
  imageUrl: string | null;
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
        <div className="flex items-end gap-4">
          <div className="flex-1">
            {/* Hidden fallback to keep track of the existing image if a new one isn't uploaded */}
            <input
              type="hidden"
              name="existingImageUrl"
              value={imageUrl ?? ""}
            />

            <label className="block text-sm font-medium mb-1">
              Category Image / Icon
            </label>
            <input
              type="file"
              name="imageFile"
              accept="image/*"
              className="w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
            />
            {errors.imageUrl && (
              <p className="mt-1 text-sm text-red-600">{errors.imageUrl}</p>
            )}
          </div>
          {imageUrl && (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={imageUrl}
              alt=""
              className="size-11 shrink-0 rounded-xl border border-line bg-white object-contain"
            />
          )}
        </div>
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
