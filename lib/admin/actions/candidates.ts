'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { prisma } from '@/lib/prisma';
import { requireAdmin } from '@/lib/admin/auth';
import { setFlash } from '@/lib/admin/flash-server';
import type { ActionState, DeleteResult } from '@/lib/admin/action-state';
import { FIX_FIELDS_MESSAGE, formValues, isUniqueViolation, validationError } from '@/lib/admin/form';
import { InvalidCvFileError, removeCv, uploadCv } from '@/lib/cv-storage';
import { removeCvsIfUnused } from '@/lib/admin/cv-files';
import { markSubmitted, reachesEmployer } from '@/lib/admin/submission';
import { givePositionOfJob } from '@/lib/admin/positions';
import { assignToJobSchema, candidateManualStatusSchema, candidateSchema, cvFileSchema } from '@/schemas/AdminSchemas';
import { sendCandidateProfileEmail } from '@/lib/admin/candidate-profile-email';
import { isUuid } from '@/lib/utils';
import { remainingPositions } from '@/lib/jobs/capacity';
import { scheduleCandidateIndexing } from '@/lib/matching/indexing';
import type { z } from 'zod';

const LIST_PATH = '/admin/candidates';
const PEOPLE_PATH = '/admin/people';
const ALREADY_APPLIED = 'This candidate has already applied for this job.';

type CandidateInput = z.infer<typeof candidateSchema>;
type Cv = { path: string; url: string };

function revalidateCandidateViews() {
  revalidatePath(LIST_PATH, 'layout');
  revalidatePath(PEOPLE_PATH, 'layout');
  revalidatePath('/admin/jobs', 'layout');
  revalidatePath('/admin');
}

/** Why a person can't get a new application, if they can't. */
function personBlocker(person: { status: string } | null): string | undefined {
  if (person?.status === 'hired') return 'This candidate is already hired and can’t be added to another job.';
  if (person?.status === 'inactive') {
    return 'This candidate is inactive. Set them back to open on their profile before adding a new application.';
  }
  return undefined;
}

/** Field errors that stop an admin-added candidate before the CV upload. */
async function addBlockers(data: CandidateInput): Promise<ActionState['errors']> {
  const { jobId } = data;
  const [job, person] = await Promise.all([
    jobId
      ? prisma.job.findUnique({
          where: { id: jobId },
          select: { client: { select: { email: true, _count: { select: { users: { where: { role: 'EMPLOYER' } } } } } } },
        })
      : null,
    prisma.candidate.findUnique({
      where: { email: data.email },
      // No job: only whether the person exists matters (a blank id isn't a valid uuid to filter on).
      select: { status: true, applications: { where: jobId ? { jobId } : { id: { in: [] } }, select: { id: true } } },
    }),
  ]);
  if (!jobId) return person ? { email: ['A candidate with this email already exists. Open them under People.'] } : undefined;
  if (!job) return { jobId: ['This job no longer exists.'] };
  const blocked = personBlocker(person);
  if (blocked) return { email: [blocked] };
  if (person?.applications.length) return { jobId: ['This candidate has already applied for this job.'] };
  if (data.status === 'submitted' && !job.client.email && !job.client._count.users) {
    return { jobId: ['Add a client login (Users) or an email address to this job’s client before submitting a candidate.'] };
  }
  if (data.status === 'submitted' && !data.screeningNotes?.trim()) {
    return { screeningNotes: ['Add pre-screening interview notes before submitting a candidate.'] };
  }
  return undefined;
}

/** Person (found by email, details and CV updated), plus the application when a job was chosen. */
async function saveCandidate(data: CandidateInput, cv: Cv, actorId: string) {
  const { firstName, lastName, phone, email, linkedin, coverLetter, screeningNotes, jobId, status } = data;
  const person$ = { firstName, lastName, phone, linkedin, cvUrl: cv.url, cvPath: cv.path };
  return prisma.$transaction(async (tx) => {
    const person = await tx.candidate.upsert({
      where: { email },
      create: { ...person$, email },
      update: person$,
      select: { id: true },
    });
    if (!jobId) return { personId: person.id, applicationId: null };
    const app = await tx.jobApplication.create({
      data: { candidateId: person.id, jobId, status, coverLetter, screeningNotes, cvUrl: cv.url, cvPath: cv.path },
      select: { id: true },
    });
    await tx.applicationEvent.create({ data: { applicationId: app.id, field: 'status', toValue: status, actorId } });
    if (reachesEmployer(status)) await markSubmitted(tx, app.id);
    await givePositionOfJob(tx, person.id, jobId);
    return { personId: person.id, applicationId: app.id };
  });
}

async function uploadOrError(file: File, values: Record<string, string>): Promise<Cv | ActionState> {
  try {
    return await uploadCv(file);
  } catch (error) {
    if (error instanceof InvalidCvFileError) return { errors: { cv: [error.message] }, values };
    console.error('Supabase Storage CV upload failed:', error);
    return { message: 'Could not upload the CV. Please try again.', values };
  }
}

/** Admin adds a candidate: to a job (an application), or to the talent pool when no job is chosen. */
export async function createCandidate(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const user = await requireAdmin();

  const values = formValues(formData);
  const result = candidateSchema.safeParse(values);
  const cv = cvFileSchema.safeParse(formData.get('cv'));
  if (!result.success || !cv.success) {
    const state = result.success ? { message: FIX_FIELDS_MESSAGE, values } : validationError(result.error, values);
    if (!cv.success) state.errors = { ...state.errors, cv: [cv.error.issues[0].message] };
    return state;
  }

  const errors = await addBlockers(result.data);
  if (errors) return { message: FIX_FIELDS_MESSAGE, errors, values };

  const upload = await uploadOrError(cv.data, values);
  if (!('path' in upload)) return upload;

  let saved: Awaited<ReturnType<typeof saveCandidate>>;
  try {
    saved = await saveCandidate(result.data, upload, user.id);
  } catch (error) {
    // Don't leave an orphaned file behind when the row didn't save.
    await removeCv(upload.path);
    if (isUniqueViolation(error)) return { errors: { jobId: ['This candidate has already applied for this job.'] }, values };
    throw error;
  }

  scheduleCandidateIndexing(saved.personId);
  revalidateCandidateViews();
  const name = `${result.data.firstName} ${result.data.lastName}`;
  if (!saved.applicationId) {
    await setFlash(`${name} added to the talent pool.`);
    redirect(`${PEOPLE_PATH}/${saved.personId}`);
  }
  if (result.data.status === 'submitted') {
    const email = await sendCandidateProfileEmail(saved.applicationId);
    if (email.error) {
      await setFlash(email.error);
      redirect(`${LIST_PATH}/${saved.applicationId}`);
    }
    if (email.notice) {
      await setFlash(`Candidate ${name} added. ${email.notice}`);
      redirect(LIST_PATH);
    }
  }
  await setFlash(`Candidate ${name} added.`);
  redirect(LIST_PATH);
}

type AssignStatus = z.infer<typeof assignToJobSchema>['status'];
type AssignResult = { applicationId: string } | { error: string; field?: 'jobId' };

/**
 * Puts a pool candidate forward for a job with the CV on their profile: the
 * application, its first history row and the job's position, in one transaction.
 * Shared by the profile's assign form and the job page's matched candidates.
 */
async function createAssignment(candidateId: string, jobId: string, status: AssignStatus, actorId: string): Promise<AssignResult> {
  const [person, job] = await Promise.all([
    prisma.candidate.findUnique({
      where: { id: candidateId },
      select: { status: true, cvUrl: true, cvPath: true, applications: { where: { jobId }, select: { id: true } } },
    }),
    prisma.job.findUnique({ where: { id: jobId }, select: { status: true, totalPositions: true, filledPositions: true } }),
  ]);
  if (!person) return { error: 'This candidate no longer exists.' };
  if (!job) return { error: 'This job no longer exists.', field: 'jobId' };
  const blocked = personBlocker(person);
  if (blocked) return { error: blocked };
  if (person.applications.length) return { error: ALREADY_APPLIED, field: 'jobId' };
  if (!remainingPositions(job)) return { error: 'This job is closed or has no positions left.', field: 'jobId' };
  if (!person.cvUrl) return { error: 'Upload a CV for this candidate before assigning them to a job.' };
  const cvUrl = person.cvUrl;

  try {
    const applicationId = await prisma.$transaction(async (tx) => {
      const app = await tx.jobApplication.create({
        data: { candidateId, jobId, status, cvUrl, cvPath: person.cvPath },
        select: { id: true },
      });
      await tx.applicationEvent.create({ data: { applicationId: app.id, field: 'status', toValue: status, actorId } });
      await givePositionOfJob(tx, candidateId, jobId);
      return app.id;
    });
    return { applicationId };
  } catch (error) {
    if (isUniqueViolation(error)) return { error: ALREADY_APPLIED, field: 'jobId' };
    throw error;
  }
}

/** Admin puts a pool candidate forward for a job, reusing the CV on their profile. */
export async function assignToJob(candidateId: string, _prev: ActionState, formData: FormData): Promise<ActionState> {
  const user = await requireAdmin();
  const values = formValues(formData);
  const parsed = assignToJobSchema.safeParse(values);
  if (!parsed.success) return validationError(parsed.error, values);

  const result = await createAssignment(candidateId, parsed.data.jobId, parsed.data.status, user.id);
  if ('error' in result) {
    return result.field ? { errors: { [result.field]: [result.error] }, values } : { message: result.error, values };
  }

  revalidateCandidateViews();
  await setFlash('Candidate assigned to the job.');
  redirect(`${LIST_PATH}/${result.applicationId}`);
}

/** "Assign to job" on a job's matched candidates: same rules as assignToJob, status pending, no redirect. */
export async function assignMatchedCandidate(jobId: string, candidateId: string): Promise<DeleteResult> {
  const user = await requireAdmin();
  if (!isUuid(jobId) || !isUuid(candidateId)) return { error: 'Invalid candidate or job.' };

  const result = await createAssignment(candidateId, jobId, 'pending', user.id);
  if ('error' in result) return { error: result.error };

  revalidateCandidateViews();
  return {};
}

/** Admin sets a person open or inactive. Hired is set only by hiring, and stays. */
export async function setCandidateStatus(candidateId: string, status: string): Promise<DeleteResult> {
  await requireAdmin();
  const parsed = candidateManualStatusSchema.safeParse(status);
  if (!parsed.success) return { error: 'Invalid status.' };

  const updated = await prisma.candidate.updateMany({
    where: { id: candidateId, status: { not: 'hired' } },
    data: { status: parsed.data },
  });
  if (!updated.count) {
    const person = await prisma.candidate.findUnique({ where: { id: candidateId }, select: { status: true } });
    return { error: person ? 'A hired candidate stays hired.' : 'This candidate no longer exists.' };
  }

  revalidateCandidateViews();
  return {};
}

/** Removes a person, their applications and CVs. Not once hired: that hire fills a position. */
export async function deletePerson(candidateId: string): Promise<DeleteResult> {
  await requireAdmin();
  if (!isUuid(candidateId)) return {};
  const person = await prisma.candidate.findUnique({
    where: { id: candidateId },
    select: { cvPath: true, applications: { select: { status: true, cvPath: true } } },
  });
  if (!person) return {};
  if (person.applications.some((a) => a.status === 'hired')) {
    return { error: 'A hired candidate can’t be deleted: their hire is the record behind a filled position.' };
  }

  await prisma.candidate.deleteMany({ where: { id: candidateId } });
  await removeCvsIfUnused([person.cvPath, ...person.applications.map((a) => a.cvPath)]);
  revalidateCandidateViews();
  return {};
}
