'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { prisma } from '@/lib/prisma';
import { requireAdmin } from '@/lib/admin/auth';
import type { ActionState } from '@/lib/admin/action-state';
import {
  formValues,
  isNotFound,
  isUniqueViolation,
  slugify,
  validationError,
} from '@/lib/admin/form';
import { categoryNameField, jobCategorySchema } from '@/schemas/AdminSchemas';
import { defaultLocale, locales } from '@/types/locale';

const LIST_PATH = '/admin/categories';

function parse(formData: FormData) {
  const values = formValues(formData);
  // Blank slug → derive it from the default-locale name.
  const input = {
    ...values,
    slug: values.slug?.trim() || slugify(values[categoryNameField(defaultLocale)] ?? ''),
  };
  return { values, result: jobCategorySchema.safeParse(input) };
}

/** Locales that have a non-empty name, as rows for the translations table. */
function translationRows(data: Record<string, unknown>) {
  return locales.flatMap((locale) => {
    const name = data[categoryNameField(locale)];
    return typeof name === 'string' && name ? [{ locale, name }] : [];
  });
}

export async function createCategory(
  _prev: ActionState,
  formData: FormData
): Promise<ActionState> {
  await requireAdmin();

  const { values, result } = parse(formData);
  if (!result.success) return validationError(result.error, values);
  const { slug, imageUrl, isActive, sortOrder } = result.data;

  try {
    await prisma.jobCategory.create({
      data: {
        slug,
        imageUrl,
        isActive,
        sortOrder,
        translations: { create: translationRows(result.data) },
      },
    });
  } catch (error) {
    if (isUniqueViolation(error)) {
      return { errors: { slug: ['This slug is already in use.'] }, values };
    }
    throw error;
  }

  revalidatePath(LIST_PATH);
  redirect(LIST_PATH);
}

export async function updateCategory(
  id: string,
  _prev: ActionState,
  formData: FormData
): Promise<ActionState> {
  await requireAdmin();

  const { values, result } = parse(formData);
  if (!result.success) return validationError(result.error, values);
  const { slug, imageUrl, isActive, sortOrder } = result.data;
  const rows = translationRows(result.data);

  try {
    await prisma.$transaction([
      prisma.jobCategory.update({
        where: { id },
        data: { slug, imageUrl, isActive, sortOrder },
      }),
      // Upsert filled-in locales; remove locales whose name was cleared.
      ...rows.map(({ locale, name }) =>
        prisma.jobCategoryTranslation.upsert({
          where: { categoryId_locale: { categoryId: id, locale } },
          create: { categoryId: id, locale, name },
          update: { name },
        })
      ),
      prisma.jobCategoryTranslation.deleteMany({
        where: { categoryId: id, locale: { notIn: rows.map((r) => r.locale) } },
      }),
    ]);
  } catch (error) {
    if (isUniqueViolation(error)) {
      return { errors: { slug: ['This slug is already in use.'] }, values };
    }
    if (isNotFound(error)) {
      return { message: 'This category no longer exists.', values };
    }
    throw error;
  }

  revalidatePath(LIST_PATH);
  redirect(LIST_PATH);
}

export async function deleteCategory(id: string): Promise<void> {
  await requireAdmin();
  // deleteMany is a no-op if the row is already gone (e.g. double click).
  await prisma.jobCategory.deleteMany({ where: { id } });
  revalidatePath(LIST_PATH);
}

export async function toggleCategoryActive(id: string): Promise<void> {
  await requireAdmin();
  const category = await prisma.jobCategory.findUnique({
    where: { id },
    select: { isActive: true },
  });
  if (!category) return;
  await prisma.jobCategory.update({
    where: { id },
    data: { isActive: !category.isActive },
  });
  revalidatePath(LIST_PATH);
}
