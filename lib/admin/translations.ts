import type { z } from 'zod';
import type { ActionState } from '@/lib/admin/action-state';
import { translationField, TRANSLATION_LOCALES } from '@/schemas/AdminSchemas';
import type { Locale } from '@/types/locale';

type FieldErrors = NonNullable<ActionState['errors']>;

export type TranslationRow<T> = T & { locale: Locale };

export type ParsedTranslations<T> =
  | { success: true; rows: TranslationRow<T>[]; emptyLocales: Locale[] }
  | { success: false; errors: FieldErrors };

/**
 * Reads the optional translated fields of a form (`title_el`, `answer_el`, ...)
 * for every non-default locale and validates each locale with `schema`.
 * A locale whose fields are all blank yields no row: the site then shows the
 * English text, and `emptyLocales` tells the caller to delete any stored row.
 */
export function parseTranslations<S extends z.ZodObject<z.ZodRawShape>>(
  schema: S,
  values: Record<string, string>,
  normalize: (field: string, value: string) => string = (_field, value) => value
): ParsedTranslations<z.infer<S>> {
  const fields = Object.keys(schema.shape);
  const rows: TranslationRow<z.infer<S>>[] = [];
  const emptyLocales: Locale[] = [];
  const errors: FieldErrors = {};

  for (const locale of TRANSLATION_LOCALES) {
    const input = Object.fromEntries(
      fields.map((field) => [field, normalize(field, values[translationField(field, locale)] ?? '')])
    );
    const result = schema.safeParse(input);
    if (!result.success) {
      for (const [field, messages] of Object.entries(result.error.flatten().fieldErrors)) {
        if (messages) errors[translationField(field, locale)] = messages;
      }
      continue;
    }
    const data: z.infer<S> = result.data;
    const hasText = Object.values(data).some((value) => typeof value === 'string' && value.trim() !== '');
    if (hasText) rows.push({ ...data, locale });
    else emptyLocales.push(locale);
  }

  return Object.keys(errors).length ? { success: false, errors } : { success: true, rows, emptyLocales };
}

/** Stored translation rows → form default values keyed by field name (`title_el`, ...). */
export function translationFormValues(
  rows: ({ locale: string } & Record<string, unknown>)[],
  fields: readonly string[]
): Record<string, string> {
  const values: Record<string, string> = {};
  for (const row of rows) {
    for (const field of fields) {
      const value = row[field];
      if (typeof value === 'string') values[translationField(field, row.locale)] = value;
    }
  }
  return values;
}
