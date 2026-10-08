'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { prisma } from '@/lib/prisma';
import { requireAdmin } from '@/lib/admin/auth';
import type { ActionState } from '@/lib/admin/action-state';
import { formValues, isNotFound, validationError } from '@/lib/admin/form';
import { sanitizeRichText } from '@/lib/admin/rich-text';
import { JOB_RICH_TEXT_FIELDS, jobSchema } from '@/schemas/AdminSchemas';
import type { z } from 'zod';

const LIST_PATH = '/admin/jobs';

type JobInput = z.infer<typeof jobSchema>;

function parse(formData: FormData) {
  const values = formValues(formData);
  // Sanitize before validating, so markup that's stripped (e.g. a lone
  // <script>) can't satisfy the "required" check.
  const input: Record<string, string> = { ...values };
  for (const field of JOB_RICH_TEXT_FIELDS) {
    input[field] = sanitizeRichText(values[field] ?? '');
  }
  return { values, result: jobSchema.safeParse(input) };
}

/** The selects can go stale (another admin deleted a city, …); flag the field instead of a FK error. */
async function missingRelations(data: JobInput): Promise<ActionState['errors']> {
  const [city, jobType, category] = await Promise.all([
    prisma.city.count({ where: { id: data.cityId } }),
    prisma.jobType.count({ where: { id: data.jobTypeId } }),
    prisma.jobCategory.count({ where: { id: data.jobCategoryId } }),
  ]);
  const errors: NonNullable<ActionState['errors']> = {};
  if (!city) errors.cityId = ['This city no longer exists.'];
  if (!jobType) errors.jobTypeId = ['This job type no longer exists.'];
  if (!category) errors.jobCategoryId = ['This category no longer exists.'];
  return Object.keys(errors).length ? errors : undefined;
}

export async function createJob(
  _prev: ActionState,
  formData: FormData
): Promise<ActionState> {
  await requireAdmin();

  const { values, result } = parse(formData);
  if (!result.success) return validationError(result.error, values);

  const errors = await missingRelations(result.data);
  if (errors) return { message: 'Please fix the highlighted fields.', errors, values };

  await prisma.job.create({ data: result.data });

  revalidatePath(LIST_PATH);
  revalidatePath('/admin');
  redirect(LIST_PATH);
}

export async function updateJob(
  id: string,
  _prev: ActionState,
  formData: FormData
): Promise<ActionState> {
  await requireAdmin();

  const { values, result } = parse(formData);
  if (!result.success) return validationError(result.error, values);

  const errors = await missingRelations(result.data);
  if (errors) return { message: 'Please fix the highlighted fields.', errors, values };

  try {
    await prisma.job.update({ where: { id }, data: result.data });
  } catch (error) {
    if (isNotFound(error)) {
      return { message: 'This job no longer exists.', values };
    }
    throw error;
  }

  revalidatePath(LIST_PATH);
  revalidatePath('/admin');
  redirect(LIST_PATH);
}

export async function deleteJob(id: string): Promise<void> {
  await requireAdmin();
  await prisma.job.deleteMany({ where: { id } });
  revalidatePath(LIST_PATH);
  revalidatePath('/admin');
}
