'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { prisma } from '@/lib/prisma';
import { Prisma } from '@/lib/generated/prisma/client';
import { requireAdmin } from '@/lib/admin/auth';
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

function inUseMessage(count: number) {
  return `This job type is used by ${count} ${count === 1 ? 'job' : 'jobs'}. Reassign them before deleting it.`;
}

export async function deleteJobType(id: string): Promise<DeleteResult> {
  await requireAdmin();

  try {
    const jobCount = await prisma.$transaction(async (tx) => {
      const count = await tx.job.count({ where: { jobTypeId: id } });
      if (count === 0) await tx.jobType.deleteMany({ where: { id } });
      return count;
    });
    if (jobCount > 0) return { error: inUseMessage(jobCount) };
  } catch (error) {
    // A job was linked between the count and the delete; the FK's ON DELETE
    // RESTRICT rejected it.
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2003') {
      return { error: inUseMessage(await prisma.job.count({ where: { jobTypeId: id } })) };
    }
    throw error;
  }

  revalidatePath(LIST_PATH);
  return {};
}
