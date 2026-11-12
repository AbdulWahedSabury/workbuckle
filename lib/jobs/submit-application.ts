import 'server-only';

import { revalidatePath } from 'next/cache';
import { createAdminNotification } from '@/lib/admin/actions/notifications';
import { formValues, isUniqueViolation } from '@/lib/admin/form';
import { InvalidCvFileError, removeCv, uploadCv } from '@/lib/cv-storage';
import { prisma } from '@/lib/prisma';
import { givePositionOfJob } from '@/lib/admin/positions';
import { clientIp, createRateLimiter } from '@/lib/rate-limit';
import { isUuid } from '@/lib/utils';
import { applicationSchema, cvFileSchema } from '@/schemas/AdminSchemas';
import type { z } from 'zod';

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
const allowApplication = createRateLimiter('job-application', 10, 60 * 60 * 1000);

/**
 * Public job application. Anyone can call it, so everything is checked here:
 * the job must exist and be published, the fields and CV are validated with
 * the admin's candidate rules, and the application is always created as pending.
 * The person is found by email (or created); a returning applicant's saved
 * details are never overwritten from this public form. Anyone can type any
 * email, so when the typed name or phone differ from the saved profile the
 * application is flagged for the admin and never becomes the profile's CV.
 * Hired and inactive candidates can't apply. It then shows up under Candidates.
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

  if (!(await allowApplication(clientIp(requestHeaders)))) {
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

  // Both answered like a success: this form is public, so a distinct message
  // would tell anyone whether a given email address applied, or was hired.
  const person = await findApplicant(fields.data.email, jobId);
  if (person?.alreadyApplied) return { ok: true };
  if (person && person.status !== 'open') {
    await createAdminNotification({
      title: `${person.status === 'hired' ? 'Hired' : 'Inactive'} candidate tried to apply`,
      message: `${person.name} is ${person.status} and tried to apply for ${job.title}. No application was created.`,
      type: 'WARNING',
      link: `/admin/candidates?q=${encodeURIComponent(fields.data.email)}`,
    });
    return { ok: true };
  }

  let upload: { path: string; url: string };
  try {
    upload = await uploadCv(cv.data);
  } catch (error) {
    if (error instanceof InvalidCvFileError) return { ok: false, code: 'invalid_cv', message: error.message };
    console.error('Supabase Storage CV upload failed:', error);
    return { ok: false, code: 'upload_failed', message: 'We could not upload your CV. Please try again.' };
  }

  const differences = person ? differingDetails(person, fields.data) : [];
  const note = differences.length
    ? `Applied with an email already on file, but the typed details differ from the saved profile: ${differences.join(', ')}.`
    : null;

  let applicationId: string;
  try {
    // A matching returning applicant without a saved CV gets this one; a mismatch never does,
    // and doesn't get the job's position either (it may not be the person behind the email).
    applicationId = await saveApplication(fields.data, jobId, upload, {
      fillMissingCv: Boolean(person) && !differences.length,
      givePosition: !differences.length,
      note,
    });
  } catch (error) {
    // Don't leave an orphaned file behind when the row didn't save.
    await removeCv(upload.path);
    // Two submits racing past the check above: the first one saved it.
    if (isUniqueViolation(error)) return { ok: true };
    console.error('Saving application failed:', error);
    return { ok: false, code: 'server_error', message: 'Something went wrong. Please try again.' };
  }

  await notifyNewApplication(applicationId, job.title, fields.data, person && differences.length ? person.name : null);

  revalidatePath('/admin/candidates');
  revalidatePath('/admin/jobs');
  revalidatePath('/admin');
  return { ok: true };
}

type ApplicationFields = z.infer<typeof applicationSchema>;

/** The person behind this email, if any, and whether they already applied for this job. */
async function findApplicant(email: string, jobId: string) {
  const person = await prisma.candidate.findUnique({
    where: { email },
    select: {
      status: true,
      firstName: true,
      lastName: true,
      phone: true,
      applications: { where: { jobId }, select: { id: true } },
    },
  });
  if (!person) return null;
  return {
    status: person.status,
    firstName: person.firstName,
    lastName: person.lastName,
    phone: person.phone,
    name: `${person.firstName} ${person.lastName}`,
    alreadyApplied: person.applications.length > 0,
  };
}

const sameText = (a: string, b: string) => a.trim().replace(/\s+/g, ' ').toLowerCase() === b.trim().replace(/\s+/g, ' ').toLowerCase();
const samePhone = (a: string, b: string) => a.replace(/\D/g, '') === b.replace(/\D/g, '');

/** What the visitor typed that doesn't match the saved profile, ready to show the admin. */
function differingDetails(
  saved: { firstName: string; lastName: string; phone: string },
  typed: ApplicationFields,
): string[] {
  const differences: string[] = [];
  if (!sameText(`${saved.firstName} ${saved.lastName}`, `${typed.firstName} ${typed.lastName}`)) {
    differences.push(`name "${typed.firstName} ${typed.lastName}"`);
  }
  if (!samePhone(saved.phone, typed.phone)) differences.push(`phone "${typed.phone}"`);
  return differences;
}

/**
 * Alerts the admin panel (sound + toast). Best effort: the application is already
 * saved, so a failure is logged, not shown to the visitor. `savedName` is set when
 * the typed details differ from the profile behind that email: possibly someone
 * else using their address, so the admin checks before it goes to an employer.
 */
async function notifyNewApplication(
  applicationId: string,
  jobTitle: string,
  typed: ApplicationFields,
  savedName: string | null,
): Promise<void> {
  const link = `/admin/candidates/${applicationId}`;
  if (savedName) {
    await createAdminNotification({
      title: 'New application: check the details',
      message: `An application for ${jobTitle} used ${savedName}'s email (${typed.email}) but different details (typed: ${typed.firstName} ${typed.lastName}, ${typed.phone}). Check it before submitting to the employer.`,
      type: 'WARNING',
      link,
    });
    return;
  }
  await createAdminNotification({
    title: 'New job application',
    message: `${typed.firstName} ${typed.lastName} applied for ${jobTitle}.`,
    type: 'SUCCESS',
    link,
  });
}

/** Finds or creates the person, then adds the pending application and its first history row. */
async function saveApplication(
  fields: ApplicationFields,
  jobId: string,
  cv: { path: string; url: string },
  { fillMissingCv, givePosition, note }: { fillMissingCv: boolean; givePosition: boolean; note: string | null },
): Promise<string> {
  const { coverLetter, ...personDetails } = fields;
  return prisma.$transaction(async (tx) => {
    const person = await tx.candidate.upsert({
      where: { email: fields.email },
      create: { ...personDetails, cvUrl: cv.url, cvPath: cv.path },
      update: {},
      select: { id: true },
    });
    // A returning applicant keeps their saved CV; one without a CV gets this one, unless the details didn't match.
    if (fillMissingCv) {
      await tx.candidate.updateMany({ where: { id: person.id, cvUrl: null }, data: { cvUrl: cv.url, cvPath: cv.path } });
    }
    const application = await tx.jobApplication.create({
      data: { candidateId: person.id, jobId, status: 'pending', coverLetter, cvUrl: cv.url, cvPath: cv.path },
      select: { id: true },
    });
    await tx.applicationEvent.create({
      data: { applicationId: application.id, field: 'status', toValue: 'pending', note },
    });
    if (givePosition) await givePositionOfJob(tx, person.id, jobId);
    return application.id;
  });
}
