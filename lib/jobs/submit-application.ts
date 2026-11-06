import 'server-only';

import { revalidatePath } from 'next/cache';
import { createAdminNotification } from '@/lib/admin/actions/notifications';
import { formValues } from '@/lib/admin/form';
import { InvalidCvFileError, removeCv, uploadCv } from '@/lib/cv-storage';
import { prisma } from '@/lib/prisma';
import { clientIp, createRateLimiter } from '@/lib/rate-limit';
import { isUuid } from '@/lib/utils';
import { applicationSchema, cvFileSchema } from '@/schemas/AdminSchemas';

/** Why an application was refused; the site translates these (apply.errors in lang/*.json). */
export type ApplicationErrorCode =
  | 'job_unavailable'
  | 'invalid'
  | 'rate_limited'
  | 'invalid_cv'
  | 'upload_failed'
  | 'server_error';

/** `message` is English, for the public API and the English site. */
export type ApplicationResult =
  | { ok: true }
  | { ok: false; code: ApplicationErrorCode; message: string };

const JOB_UNAVAILABLE = {
  ok: false,
  code: 'job_unavailable',
  message: 'This job is no longer accepting applications.',
} as const satisfies ApplicationResult;

// Each attempt can store a 10 MB file and alert the panel. Forms with
// validation errors don't count, so correcting a typo never uses one up.
const allowApplication = createRateLimiter(10, 60 * 60 * 1000);

/**
 * Public job application. Anyone can call it, so everything is checked here:
 * the job must exist and be published, the fields and CV are validated with
 * the admin's candidate rules, and the candidate is always created as pending.
 * It then shows up under Candidates in the admin panel.
 */
export async function submitPublicApplication(
  jobId: string,
  formData: FormData,
  requestHeaders: Headers,
): Promise<ApplicationResult> {
  if (typeof jobId !== 'string' || !isUuid(jobId)) return JOB_UNAVAILABLE;

  const fields = applicationSchema.safeParse(formValues(formData));
  const cv = cvFileSchema.safeParse(formData.get('cv'));
  if (!fields.success || !cv.success) {
    // The form shows one message; list each problem once.
    const problems = [
      ...(fields.success ? [] : Object.values(fields.error.flatten().fieldErrors).flat()),
      ...(cv.success ? [] : [cv.error.issues[0].message]),
    ];
    return { ok: false, code: 'invalid', message: [...new Set(problems)].join(' ') };
  }

  if (!allowApplication(clientIp(requestHeaders))) {
    return {
      ok: false,
      code: 'rate_limited',
      message: 'Too many applications from your network. Please try again later.',
    };
  }

  const job = await prisma.job.findFirst({
    where: { id: jobId, status: 'published' },
    select: { id: true, title: true },
  });
  if (!job) return JOB_UNAVAILABLE;

  // A double-click or resubmit shouldn't create a second candidate. Answered
  // like a success: this form is public, so a distinct message would tell
  // anyone whether a given email address applied for this job.
  const alreadyApplied = await prisma.candidate.count({
    where: { jobId, email: { equals: fields.data.email, mode: 'insensitive' } },
  });
  if (alreadyApplied) return { ok: true };

  let upload: { path: string; url: string };
  try {
    upload = await uploadCv(cv.data);
  } catch (error) {
    if (error instanceof InvalidCvFileError) return { ok: false, code: 'invalid_cv', message: error.message };
    console.error('Supabase Storage CV upload failed:', error);
    return { ok: false, code: 'upload_failed', message: 'We could not upload your CV. Please try again.' };
  }

  let candidateId: string;
  try {
    ({ id: candidateId } = await prisma.candidate.create({
      data: { ...fields.data, jobId, status: 'pending', cvUrl: upload.url, cvPath: upload.path },
      select: { id: true },
    }));
  } catch (error) {
    // Don't leave an orphaned file behind when the row didn't save.
    await removeCv(upload.path);
    console.error('Saving application failed:', error);
    return { ok: false, code: 'server_error', message: 'Something went wrong. Please try again.' };
  }

  // Alerts the admin panel (sound + toast). Best effort: the application is
  // already saved, so a failure here is logged, not shown to the candidate.
  await createAdminNotification({
    title: 'New job application',
    message: `${fields.data.firstName} ${fields.data.lastName} applied for ${job.title}.`,
    type: 'SUCCESS',
    link: `/admin/candidates/${candidateId}`,
  });

  revalidatePath('/admin/candidates');
  revalidatePath('/admin/jobs');
  revalidatePath('/admin');
  return { ok: true };
}
