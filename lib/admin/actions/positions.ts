'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { prisma } from '@/lib/prisma';
import { Prisma } from '@/lib/generated/prisma/client';
import { requireAdmin } from '@/lib/admin/auth';
import { setFlash } from '@/lib/admin/flash-server';
import type { ActionState, DeleteResult } from '@/lib/admin/action-state';
import { deleteUnlessUsedByJobs } from '@/lib/admin/delete-guard';
import { formValues, isNotFound, isUniqueViolation, slugify, validationError } from '@/lib/admin/form';
import { isUuid } from '@/lib/utils';
import { personPositionsSchema, positionSchema } from '@/schemas/AdminSchemas';

const LIST_PATH = '/admin/positions';
const PEOPLE_PATH = '/admin/people';

function parse(formData: FormData) {
  const values = formValues(formData);
  // Blank slug → derive it from the name.
  const input = { ...values, slug: values.slug?.trim() || slugify(values.name ?? '') };
  return { values, result: positionSchema.safeParse(input) };
}

const SLUG_TAKEN = { slug: ['This slug is already in use.'] };

export async function createPosition(_prev: ActionState, formData: FormData): Promise<ActionState> {
  await requireAdmin();
  const { values, result } = parse(formData);
  if (!result.success) return validationError(result.error, values);

  try {
    await prisma.position.create({ data: result.data });
  } catch (error) {
    if (isUniqueViolation(error)) return { errors: SLUG_TAKEN, values };
    throw error;
  }

  revalidatePath(LIST_PATH);
  await setFlash(`Position "${result.data.name}" created.`);
  redirect(LIST_PATH);
}

export async function updatePosition(id: string, _prev: ActionState, formData: FormData): Promise<ActionState> {
  await requireAdmin();
  const { values, result } = parse(formData);
  if (!result.success) return validationError(result.error, values);

  try {
    await prisma.position.update({ where: { id }, data: result.data });
  } catch (error) {
    if (isUniqueViolation(error)) return { errors: SLUG_TAKEN, values };
    if (isNotFound(error)) return { message: 'This position no longer exists.', values };
    throw error;
  }

  revalidatePath(LIST_PATH);
  revalidatePath(PEOPLE_PATH, 'layout');
  await setFlash(`Position "${result.data.name}" updated.`);
  redirect(LIST_PATH);
}

/** Refused while jobs use it; people who had it simply lose it. */
export async function deletePosition(id: string): Promise<DeleteResult> {
  await requireAdmin();
  if (!isUuid(id)) return { error: 'This position no longer exists.' };
  const result = await deleteUnlessUsedByJobs('position', { positionId: id }, (tx) =>
    tx.position.deleteMany({ where: { id } })
  );
  if (!result.error) {
    revalidatePath(LIST_PATH);
    revalidatePath(PEOPLE_PATH, 'layout');
  }
  return result;
}

/**
 * Sets exactly which positions a person has, from their profile. Positions
 * added automatically (from jobs) can be removed here too; applying again adds
 * the job's position back.
 */
export async function setPersonPositions(candidateId: string, positionIds: string[]): Promise<DeleteResult> {
  await requireAdmin();
  if (!isUuid(candidateId)) return { error: 'This candidate no longer exists.' };
  const parsed = personPositionsSchema.safeParse(positionIds);
  if (!parsed.success) return { error: 'Choose valid positions.' };
  const ids = parsed.data;

  const [person, known] = await Promise.all([
    prisma.candidate.count({ where: { id: candidateId } }),
    prisma.position.count({ where: { id: { in: ids } } }),
  ]);
  if (!person) return { error: 'This candidate no longer exists.' };
  if (known !== ids.length) return { error: 'A position was deleted meanwhile. Refresh and try again.' };

  try {
    await prisma.$transaction([
      prisma.candidatePosition.deleteMany({ where: { candidateId, positionId: { notIn: ids } } }),
      prisma.candidatePosition.createMany({
        data: ids.map((positionId) => ({ candidateId, positionId })),
        skipDuplicates: true,
      }),
    ]);
  } catch (error) {
    // The person or a position was deleted between the checks above and the write.
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2003') {
      return { error: 'A position or this candidate was deleted meanwhile. Refresh and try again.' };
    }
    throw error;
  }

  revalidatePath(`${PEOPLE_PATH}/${candidateId}`);
  revalidatePath(PEOPLE_PATH);
  return {};
}
