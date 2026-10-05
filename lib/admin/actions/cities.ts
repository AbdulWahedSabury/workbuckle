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
import { citySchema } from '@/schemas/AdminSchemas';

const LIST_PATH = '/admin/cities';

function parse(formData: FormData) {
  const values = formValues(formData);
  // Blank slug → derive it from the name.
  const input = { ...values, slug: values.slug?.trim() || slugify(values.name ?? '') };
  return { values, result: citySchema.safeParse(input) };
}

export async function createCity(
  _prev: ActionState,
  formData: FormData
): Promise<ActionState> {
  await requireAdmin();

  const { values, result } = parse(formData);
  if (!result.success) return validationError(result.error, values);

  try {
    await prisma.city.create({ data: result.data });
  } catch (error) {
    if (isUniqueViolation(error)) {
      return { errors: { slug: ['This slug is already in use.'] }, values };
    }
    throw error;
  }

  revalidatePath(LIST_PATH);
  redirect(LIST_PATH);
}

export async function updateCity(
  id: string,
  _prev: ActionState,
  formData: FormData
): Promise<ActionState> {
  await requireAdmin();

  const { values, result } = parse(formData);
  if (!result.success) return validationError(result.error, values);

  try {
    await prisma.city.update({ where: { id }, data: result.data });
  } catch (error) {
    if (isUniqueViolation(error)) {
      return { errors: { slug: ['This slug is already in use.'] }, values };
    }
    if (isNotFound(error)) {
      return { message: 'This city no longer exists.', values };
    }
    throw error;
  }

  revalidatePath(LIST_PATH);
  redirect(LIST_PATH);
}

export async function deleteCity(id: string): Promise<void> {
  await requireAdmin();
  await prisma.city.deleteMany({ where: { id } });
  revalidatePath(LIST_PATH);
}
