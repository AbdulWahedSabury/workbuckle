'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { prisma } from '@/lib/prisma';
import { requireAdmin } from '@/lib/admin/auth';
import { setFlash } from '@/lib/admin/flash-server';
import { deleteUnlessUsedByJobs } from '@/lib/admin/delete-guard';
import { isUuid } from '@/lib/utils';
import type { ActionState, DeleteResult } from '@/lib/admin/action-state';
import {
  formValues,
  isNotFound,
  isUniqueViolation,
  slugify,
  validationError,
  FIX_FIELDS_MESSAGE,
} from '@/lib/admin/form';
import { parseTranslations, type ParsedTranslations } from '@/lib/admin/translations';
import { jobTypeSchema, jobTypeTranslationSchema } from '@/schemas/AdminSchemas';
import type { z } from 'zod';

const LIST_PATH = '/admin/job-types';

type JobTypeInput = z.infer<typeof jobTypeSchema>;
type JobTypeTranslations = ParsedTranslations<z.infer<typeof jobTypeTranslationSchema>>;

function parse(formData: FormData) {
  const values = formValues(formData);
  // Blank slug → derive it from the name.
  const input = { ...values, slug: values.slug?.trim() || slugify(values.name ?? '') };
  return {
    values,
    result: jobTypeSchema.safeParse(input),
    translations: parseTranslations(jobTypeTranslationSchema, values),
  };
}

/** Field errors from the English fields and the translated ones, in one response. */
function invalidForm(
  values: Record<string, string>,
  result: z.SafeParseReturnType<unknown, JobTypeInput>,
  translations: JobTypeTranslations
): ActionState {
  return {
    message: FIX_FIELDS_MESSAGE,
    errors: {
      ...(result.success ? {} : validationError(result.error, values).errors),
      ...(translations.success ? {} : translations.errors),
    },
    values,
  };
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

  const { values, result, translations } = parse(formData);
  if (!result.success || !translations.success) return invalidForm(values, result, translations);

  const errors = await uniqueErrors(result.data);
  if (errors) return { errors, values };

  try {
    await prisma.jobType.create({
      data: { ...result.data, translations: { create: translations.rows } },
    });
  } catch (error) {
    // Lost a race with another create between the check and the insert.
    if (isUniqueViolation(error)) {
      return { errors: await uniqueErrors(result.data), values };
    }
    throw error;
  }

  revalidatePath(LIST_PATH);
  await setFlash(`Job type "${result.data.name}" created.`);
  redirect(LIST_PATH);
}

export async function updateJobType(
  id: string,
  _prev: ActionState,
  formData: FormData
): Promise<ActionState> {
  await requireAdmin();

  const { values, result, translations } = parse(formData);
  if (!result.success || !translations.success) return invalidForm(values, result, translations);

  const errors = await uniqueErrors(result.data, id);
  if (errors) return { errors, values };

  try {
    await prisma.$transaction([
      prisma.jobType.update({ where: { id }, data: result.data }),
      ...translations.rows.map(({ locale, name }) =>
        prisma.jobTypeTranslation.upsert({
          where: { jobTypeId_locale: { jobTypeId: id, locale } },
          create: { jobTypeId: id, locale, name },
          update: { name },
        })
      ),
      // Name left blank for a language: show the English name again.
      prisma.jobTypeTranslation.deleteMany({
        where: { jobTypeId: id, locale: { in: translations.emptyLocales } },
      }),
    ]);
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
  await setFlash(`Job type "${result.data.name}" updated.`);
  redirect(LIST_PATH);
}

export async function deleteJobType(id: string): Promise<DeleteResult> {
  await requireAdmin();
  if (!isUuid(id)) return { error: 'This job type no longer exists.' };
  const result = await deleteUnlessUsedByJobs('job type', { jobTypeId: id }, (tx) =>
    tx.jobType.deleteMany({ where: { id } })
  );
  if (!result.error) revalidatePath(LIST_PATH);
  return result;
}
