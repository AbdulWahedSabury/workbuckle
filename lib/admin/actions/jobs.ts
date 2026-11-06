'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { prisma } from '@/lib/prisma';
import { requireAdmin } from '@/lib/admin/auth';
import { setFlash } from '@/lib/admin/flash-server';
import type { ActionState } from '@/lib/admin/action-state';
import { FIX_FIELDS_MESSAGE, formValues, isNotFound } from '@/lib/admin/form';
import { parseTranslations, type ParsedTranslations } from '@/lib/admin/translations';
import { cvObjectPath, removeCvs } from '@/lib/cv-storage';
import { sanitizeRichText } from '@/lib/rich-text';
import { isUuid } from '@/lib/utils';
import {
  isBlankRichText,
  JOB_RICH_TEXT_FIELDS,
  jobSchema,
  jobTranslationSchema,
} from '@/schemas/AdminSchemas';
import type { z } from 'zod';

const LIST_PATH = '/admin/jobs';

type JobInput = z.infer<typeof jobSchema>;
type JobTranslations = ParsedTranslations<z.infer<typeof jobTranslationSchema>>;

/** The job list, the dashboard counts and the campaigns' job counts. */
function revalidateJobs() {
  revalidatePath(LIST_PATH);
  revalidatePath('/admin');
  revalidatePath('/admin/campaigns');
}

function parse(formData: FormData) {
  const values = formValues(formData);
  // Sanitize before validating, so markup that's stripped (e.g. a lone
  // <script>) can't satisfy the "required" check.
  const input: Record<string, string> = { ...values };
  for (const field of JOB_RICH_TEXT_FIELDS) {
    input[field] = sanitizeRichText(values[field] ?? '');
  }
  return {
    values,
    result: jobSchema.safeParse(input),
    translations: parseTranslations(jobTranslationSchema, values, normalizeTranslation),
  };
}

/** Translated rich text is sanitized like the English fields; an empty editor counts as blank. */
function normalizeTranslation(field: string, value: string): string {
  if (!(JOB_RICH_TEXT_FIELDS as readonly string[]).includes(field)) return value;
  const html = sanitizeRichText(value);
  return isBlankRichText(html) ? '' : html;
}

/** Field errors from the English fields and the translated ones, in one response. */
function invalidForm(
  values: Record<string, string>,
  result: z.SafeParseReturnType<unknown, JobInput>,
  translations: JobTranslations
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

/** The selects can go stale (another admin deleted a city, …); flag the field instead of a FK error. */
async function missingRelations(data: JobInput): Promise<ActionState['errors']> {
  const [client, city, jobType, category, campaign] = await Promise.all([
    prisma.client.count({ where: { id: data.clientId } }),
    prisma.city.count({ where: { id: data.cityId } }),
    prisma.jobType.count({ where: { id: data.jobTypeId } }),
    prisma.jobCategory.count({ where: { id: data.jobCategoryId } }),
    data.campaignId ? prisma.campaign.count({ where: { id: data.campaignId } }) : 1,
  ]);
  const errors: NonNullable<ActionState['errors']> = {};
  if (!client) errors.clientId = ['This client no longer exists.'];
  if (!city) errors.cityId = ['This city no longer exists.'];
  if (!jobType) errors.jobTypeId = ['This job type no longer exists.'];
  if (!category) errors.jobCategoryId = ['This category no longer exists.'];
  if (!campaign) errors.campaignId = ['This campaign no longer exists.'];
  return Object.keys(errors).length ? errors : undefined;
}

function createdJobMessage({ title, status }: JobInput): string {
  if (status === 'published') return `Job "${title}" published.`;
  if (status === 'draft') return `Job "${title}" saved as a draft.`;
  return `Job "${title}" created.`;
}

export async function createJob(
  _prev: ActionState,
  formData: FormData
): Promise<ActionState> {
  await requireAdmin();

  const { values, result, translations } = parse(formData);
  if (!result.success || !translations.success) return invalidForm(values, result, translations);

  const errors = await missingRelations(result.data);
  if (errors) return { message: FIX_FIELDS_MESSAGE, errors, values };

  await prisma.job.create({
    data: { ...result.data, translations: { create: translations.rows } },
  });

  revalidateJobs();
  await setFlash(createdJobMessage(result.data));
  redirect(LIST_PATH);
}

export async function updateJob(
  id: string,
  _prev: ActionState,
  formData: FormData
): Promise<ActionState> {
  await requireAdmin();

  const { values, result, translations } = parse(formData);
  if (!result.success || !translations.success) return invalidForm(values, result, translations);

  const errors = await missingRelations(result.data);
  if (errors) return { message: FIX_FIELDS_MESSAGE, errors, values };

  try {
    await prisma.$transaction([
      prisma.job.update({ where: { id }, data: result.data }),
      ...translations.rows.map(({ locale, ...text }) =>
        prisma.jobTranslation.upsert({
          where: { jobId_locale: { jobId: id, locale } },
          create: { jobId: id, locale, ...text },
          update: text,
        })
      ),
      // Every field of a language left blank: show the English text again.
      prisma.jobTranslation.deleteMany({
        where: { jobId: id, locale: { in: translations.emptyLocales } },
      }),
    ]);
  } catch (error) {
    if (isNotFound(error)) {
      return { message: 'This job no longer exists.', values };
    }
    throw error;
  }

  revalidateJobs();
  await setFlash(`Job "${result.data.title}" updated.`);
  redirect(LIST_PATH);
}

export async function deleteJob(id: string): Promise<void> {
  await requireAdmin();
  if (!isUuid(id)) return;

  // Candidates cascade with the job; their CVs are in storage, so remove them
  // too or nothing would point at those files any more.
  const candidates = await prisma.candidate.findMany({
    where: { jobId: id },
    select: { cvPath: true, cvUrl: true },
  });
  await prisma.job.deleteMany({ where: { id } });
  await removeCvs(candidates.map(cvObjectPath).filter((path) => path !== null));

  revalidateJobs();
}
