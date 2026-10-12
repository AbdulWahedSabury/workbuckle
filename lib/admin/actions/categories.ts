'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { prisma } from '@/lib/prisma';
import { requireAdmin } from '@/lib/admin/auth';
import type { ActionState, DeleteResult } from '@/lib/admin/action-state';
import { deleteUnlessUsedByJobs } from '@/lib/admin/delete-guard';
import {
  formValues,
  isNotFound,
  isUniqueViolation,
  slugify,
  validationError,
} from '@/lib/admin/form';
import { removeImage, uploadImage } from '@/lib/admin/image-upload';
import { categoryNameField, jobCategorySchema } from '@/schemas/AdminSchemas';
import { defaultLocale, locales } from '@/types/locale';

const LIST_PATH = '/admin/categories';
const IMAGE_FOLDER = 'categories';

function parse(formData: FormData) {
  const values = formValues(formData);
  const input = {
    ...values,
    imageUrl: values.existingImageUrl,
    slug: values.slug?.trim() || slugify(values[categoryNameField(defaultLocale)] ?? ''),
  };
  return { values, result: jobCategorySchema.safeParse(input) };
}

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
  const { slug, isActive, sortOrder } = result.data;

  const upload = await uploadImage(formData, 'imageFile', IMAGE_FOLDER);
  if (!upload.ok) return { errors: { imageUrl: [upload.error] }, values };

  try {
    await prisma.jobCategory.create({
      data: {
        slug,
        imageUrl: upload.image?.imageUrl ?? null,
        imagePath: upload.image?.imagePath ?? null,
        isActive,
        sortOrder,
        translations: { create: translationRows(result.data) },
      },
    });
  } catch (error) {
    await removeImage(upload.image?.imagePath);
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

  const upload = await uploadImage(formData, 'imageFile', IMAGE_FOLDER);
  if (!upload.ok) return { errors: { imageUrl: [upload.error] }, values };
  const image = upload.image ?? { imageUrl };
  const previous = upload.image
    ? await prisma.jobCategory.findUnique({ where: { id }, select: { imagePath: true } })
    : null;

  try {
    await prisma.$transaction([
      prisma.jobCategory.update({
        where: { id },
        data: { slug, ...image, isActive, sortOrder },
      }),
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
    await removeImage(upload.image?.imagePath);
    if (isUniqueViolation(error)) {
      return { errors: { slug: ['This slug is already in use.'] }, values };
    }
    if (isNotFound(error)) {
      return { message: 'This category no longer exists.', values };
    }
    throw error;
  }

  // The replaced image is no longer referenced.
  await removeImage(previous?.imagePath);

  revalidatePath(LIST_PATH);
  redirect(LIST_PATH);
}

export async function deleteCategory(id: string): Promise<DeleteResult> {
  await requireAdmin();
  let imagePath: string | null = null;
  const result = await deleteUnlessUsedByJobs('category', { jobCategoryId: id }, async (tx) => {
    const category = await tx.jobCategory.findUnique({ where: { id }, select: { imagePath: true } });
    await tx.jobCategory.deleteMany({ where: { id } });
    imagePath = category?.imagePath ?? null;
  });
  // Only once the row is really gone; a refused delete keeps its image.
  if (!result.error) {
    await removeImage(imagePath);
    revalidatePath(LIST_PATH);
  }
  return result;
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