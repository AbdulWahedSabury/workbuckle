'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { prisma } from '@/lib/prisma';
import { requireAdmin } from '@/lib/admin/auth';
import { setFlash } from '@/lib/admin/flash-server';
import type { ActionState } from '@/lib/admin/action-state';
import { FIX_FIELDS_MESSAGE, formValues, isNotFound } from '@/lib/admin/form';
import { parseTranslations, type ParsedTranslations } from '@/lib/admin/translations';
import { isUuid } from '@/lib/utils';
import { faqSchema, faqTranslationSchema } from '@/schemas/AdminSchemas';
import type { z } from 'zod';

const LIST_PATH = '/admin/faqs';

/** Public pages that render the FAQ section, in every language (app/[locale]/...). */
const PUBLIC_ROUTES = ['/[locale]', '/[locale]/contact'];

type FaqInput = z.infer<typeof faqSchema>;
type FaqTranslations = ParsedTranslations<z.infer<typeof faqTranslationSchema>>;

function revalidateFaqs() {
  revalidatePath(LIST_PATH);
  for (const route of PUBLIC_ROUTES) revalidatePath(route, 'page');
}

function parse(formData: FormData) {
  const values = formValues(formData);
  return {
    values,
    result: faqSchema.safeParse(values),
    translations: parseTranslations(faqTranslationSchema, values),
  };
}

/** Field errors from the English fields and the translated ones, in one response. */
function invalidForm(
  values: Record<string, string>,
  result: z.SafeParseReturnType<unknown, FaqInput>,
  translations: FaqTranslations
): ActionState {
  return {
    message: FIX_FIELDS_MESSAGE,
    errors: {
      ...(result.success ? {} : (result.error.flatten().fieldErrors as ActionState['errors'])),
      ...(translations.success ? {} : translations.errors),
    },
    values,
  };
}

export async function createFaq(_prev: ActionState, formData: FormData): Promise<ActionState> {
  await requireAdmin();

  const { values, result, translations } = parse(formData);
  if (!result.success || !translations.success) return invalidForm(values, result, translations);

  await prisma.faq.create({
    data: { ...result.data, translations: { create: translations.rows } },
  });

  revalidateFaqs();
  await setFlash('FAQ created.');
  redirect(LIST_PATH);
}

export async function updateFaq(
  id: string,
  _prev: ActionState,
  formData: FormData
): Promise<ActionState> {
  await requireAdmin();

  const { values, result, translations } = parse(formData);
  if (!result.success || !translations.success) return invalidForm(values, result, translations);

  try {
    await prisma.$transaction([
      prisma.faq.update({ where: { id }, data: result.data }),
      ...translations.rows.map(({ locale, ...text }) =>
        prisma.faqTranslation.upsert({
          where: { faqId_locale: { faqId: id, locale } },
          create: { faqId: id, locale, ...text },
          update: text,
        })
      ),
      // Both fields of a language left blank: show the English text again.
      prisma.faqTranslation.deleteMany({
        where: { faqId: id, locale: { in: translations.emptyLocales } },
      }),
    ]);
  } catch (error) {
    if (isNotFound(error)) {
      return { message: 'This FAQ no longer exists.', values };
    }
    throw error;
  }

  revalidateFaqs();
  await setFlash('FAQ updated.');
  redirect(LIST_PATH);
}

export async function toggleFaqActive(id: string): Promise<void> {
  await requireAdmin();
  const faq = await prisma.faq.findUnique({ where: { id }, select: { isActive: true } });
  if (!faq) {
    await setFlash('This FAQ no longer exists.', 'error');
    return;
  }
  await prisma.faq.update({ where: { id }, data: { isActive: !faq.isActive } });
  await setFlash(faq.isActive ? 'FAQ is now hidden on the site.' : 'FAQ is now visible on the site.');
  revalidateFaqs();
}

export async function deleteFaq(id: string): Promise<void> {
  await requireAdmin();
  if (!isUuid(id)) return;
  // deleteMany: already gone (e.g. deleted in another tab) is not an error.
  await prisma.faq.deleteMany({ where: { id } });
  revalidateFaqs();
}
