'use server';

import { revalidatePath } from 'next/cache';
import { createAdminNotification } from '@/lib/admin/actions/notifications';
import { formValues } from '@/lib/admin/form';
import { removeCv, uploadCv } from '@/lib/cv-storage';
import { prisma } from '@/lib/prisma';
import { isUuid } from '@/lib/utils';
import { applicationSchema, cvFileSchema } from '@/schemas/AdminSchemas';

export type ApplicationResult = { ok: true } | { ok: false; message: string };

const JOB_UNAVAILABLE = 'This job is no longer accepting applications.';

/**
 * Public job application. Anyone can call it, so everything is checked here:
 * the job must exist and be published, the fields and CV are validated with
 * the admin's candidate rules, and the candidate is always created as pending.
 * It then shows up under Candidates in the admin panel.
 */
export async function submitApplication(
  jobId: string,
  formData: FormData
): Promise<ApplicationResult> {
  if (typeof jobId !== 'string' || !isUuid(jobId)) return { ok: false, message: JOB_UNAVAILABLE };

  const fields = applicationSchema.safeParse(formValues(formData));
  const cv = cvFileSchema.safeParse(formData.get('cv'));
  if (!fields.success || !cv.success) {
    // The form shows one message; list each problem once.
    const problems = [
      ...(fields.success ? [] : Object.values(fields.error.flatten().fieldErrors).flat()),
      ...(cv.success ? [] : [cv.error.issues[0].message]),
    ];
    return { ok: false, message: [...new Set(problems)].join(' ') };
  }

  const job = await prisma.job.findFirst({
    where: { id: jobId, status: 'published' },
    select: { id: true, title: true },
  });
  if (!job) return { ok: false, message: JOB_UNAVAILABLE };

  // A double-click or resubmit shouldn't create a second candidate.
  const alreadyApplied = await prisma.candidate.count({
    where: { jobId, email: { equals: fields.data.email, mode: 'insensitive' } },
  });
  if (alreadyApplied) {
    return { ok: false, message: "You've already applied for this job with this email address." };
  }

  let upload: { path: string; url: string };
  try {
    upload = await uploadCv(cv.data);
  } catch (error) {
    console.error('Supabase Storage CV upload failed:', error);
    return { ok: false, message: 'We could not upload your CV. Please try again.' };
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
    return { ok: false, message: 'Something went wrong. Please try again.' };
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
