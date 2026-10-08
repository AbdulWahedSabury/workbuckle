'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { prisma } from '@/lib/prisma';
import { requireAdmin } from '@/lib/admin/auth';
import { deleteUnlessUsedByJobs } from '@/lib/admin/delete-guard';
import type { ActionState, DeleteResult } from '@/lib/admin/action-state';
import {
  formValues,
  isNotFound,
  isUniqueViolation,
  slugify,
  validationError,
} from '@/lib/admin/form';
import { jobTypeSchema } from '@/schemas/AdminSchemas';

const LIST_PATH = '/admin/job-types';

type JobTypeInput = { name: string; slug: string };

function parse(formData: FormData) {
  const values = formValues(formData);
  // Blank slug → derive it from the name.
  const input = { ...values, slug: values.slug?.trim() || slugify(values.name ?? '') };
  return { values, result: jobTypeSchema.safeParse(input) };
}

/** Both name and slug are unique; work out which one clashed so the right field shows it. */
async function uniqueErrors(data: JobTypeInput, excludeId?: string): Promise<ActionState['errors']> {
  const clashes = await prisma.jobType.findMany({
    where: {
      OR: [{ name: { equals: data.name, mode: 'insensitive' } }, { slug: data.slug }],
      ...(excludeId ? { NOT: { id: excludeId } } : {}),
    },
    select: { name: true, slug: true },
  });
  const errors: NonNullable<ActionState['errors']> = {};
  if (clashes.some((c) => c.name.toLowerCase() === data.name.toLowerCase())) {
    errors.name = ['A job type with this name already exists.'];
  }
  if (clashes.some((c) => c.slug === data.slug)) {
    errors.slug = ['This slug is already in use.'];
  }
  return Object.keys(errors).length ? errors : undefined;
}

export async function createJobType(
  _prev: ActionState,
  formData: FormData
): Promise<ActionState> {
  await requireAdmin();

  const { values, result } = parse(formData);
  if (!result.success) return validationError(result.error, values);

  const errors = await uniqueErrors(result.data);
  if (errors) return { errors, values };

  try {
    await prisma.jobType.create({ data: result.data });
  } catch (error) {
    // Lost a race with another create between the check and the insert.
    if (isUniqueViolation(error)) {
      return { errors: await uniqueErrors(result.data), values };
    }
    throw error;
  }

  revalidatePath(LIST_PATH);
  redirect(LIST_PATH);
}

export async function updateJobType(
  id: string,
  _prev: ActionState,
  formData: FormData
): Promise<ActionState> {
  await requireAdmin();

  const { values, result } = parse(formData);
  if (!result.success) return validationError(result.error, values);

  const errors = await uniqueErrors(result.data, id);
  if (errors) return { errors, values };

  try {
    await prisma.jobType.update({ where: { id }, data: result.data });
  } catch (error) {
    if (isUniqueViolation(error)) {
      return { errors: await uniqueErrors(result.data, id), values };
    }
    if (isNotFound(error)) {
      return { message: 'This job type no longer exists.', values };
    }
    throw error;
  }

  revalidatePath(LIST_PATH);
  redirect(LIST_PATH);
}

export async function deleteJobType(id: string): Promise<DeleteResult> {
  await requireAdmin();
  const result = await deleteUnlessUsedByJobs('job type', { jobTypeId: id }, (tx) =>
    tx.jobType.deleteMany({ where: { id } })
  );
  if (!result.error) revalidatePath(LIST_PATH);
  return result;
}
