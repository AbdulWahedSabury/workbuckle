'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { prisma } from '@/lib/prisma';
import { requireAdmin } from '@/lib/admin/auth';
import { setFlash } from '@/lib/admin/flash-server';
import type { ActionState, DeleteResult } from '@/lib/admin/action-state';
import { FIX_FIELDS_MESSAGE, formValues, isNotFound, validationError } from '@/lib/admin/form';
import { InvalidCvFileError, removeCv, uploadCv } from '@/lib/cv-storage';
import { candidateSchema, candidateScreeningNotesSchema, candidateStatusSchema, cvFileSchema } from '@/schemas/AdminSchemas';
import { sendCandidateProfileEmail } from '@/lib/admin/candidate-profile-email';

const LIST_PATH = '/admin/candidates';

function revalidateCandidateViews(id: string) {
  revalidatePath(LIST_PATH);
  revalidatePath(`${LIST_PATH}/${id}`);
  revalidatePath('/admin/jobs');
  revalidatePath('/admin');
}

export async function createCandidate(
  _prev: ActionState,
  formData: FormData
): Promise<ActionState> {
  await requireAdmin();

  const values = formValues(formData);
  const result = candidateSchema.safeParse(values);
  const cv = cvFileSchema.safeParse(formData.get('cv'));

  if (!result.success || !cv.success) {
    const state = result.success
      ? { message: FIX_FIELDS_MESSAGE, values }
      : validationError(result.error, values);
    if (!cv.success) state.errors = { ...state.errors, cv: [cv.error.issues[0].message] };
    return state;
  }

  const job = await prisma.job.findUnique({
    where: { id: result.data.jobId },
    select: { id: true, client: { select: { email: true } } },
  });
  if (!job) return { errors: { jobId: ['This job no longer exists.'] }, values };
  if (result.data.status === 'submitted' && !job.client.email) {
    return { errors: { jobId: ['Add an email address to this job’s client before submitting a candidate.'] }, values };
  }
  if (result.data.status === 'submitted' && !result.data.screeningNotes?.trim()) {
    return { errors: { screeningNotes: ['Add pre-screening interview notes before submitting a candidate.'] }, values };
  }

  let upload: { path: string; url: string };
  try {
    upload = await uploadCv(cv.data);
  } catch (error) {
    if (error instanceof InvalidCvFileError) return { errors: { cv: [error.message] }, values };
    console.error('Supabase Storage CV upload failed:', error);
    return { message: 'Could not upload the CV. Please try again.', values };
  }

  let candidateId: string;
  try {
    const candidate = await prisma.candidate.create({
      data: { ...result.data, cvUrl: upload.url, cvPath: upload.path },
      select: { id: true },
    });
    candidateId = candidate.id;
  } catch (error) {
    // Don't leave an orphaned file behind when the row didn't save.
    await removeCv(upload.path);
    throw error;
  }

  if (result.data.status === 'submitted') {
    const email = await sendCandidateProfileEmail(candidateId);
    if (email.error) {
      revalidateCandidateViews(candidateId);
      await setFlash(email.error);
      redirect(`${LIST_PATH}/${candidateId}`);
    }
  }

  revalidatePath(LIST_PATH);
  revalidatePath('/admin/jobs');
  revalidatePath('/admin');
  await setFlash(`Candidate ${result.data.firstName} ${result.data.lastName} added.`);
  redirect(LIST_PATH);
}

/** Moves a candidate through the recruiting pipeline. */
export async function updateCandidateStatus(
  id: string,
  status: string
): Promise<DeleteResult> {
  await requireAdmin();

  const parsed = candidateStatusSchema.safeParse(status);
  if (!parsed.success) return { error: 'Invalid status.' };

  const candidate = await prisma.candidate.findUnique({
    where: { id },
    select: {
      status: true,
      clientProfileEmailSentAt: true,
      screeningNotes: true,
      job: { select: { client: { select: { email: true } } } },
    },
  });
  if (!candidate) return { error: 'This candidate no longer exists.' };

  if (parsed.data === 'submitted' && !candidate.clientProfileEmailSentAt) {
    if (!candidate.job.client.email) return { error: 'Add an email address to this job’s client before submitting this candidate.' };
    if (!candidate.screeningNotes?.trim()) {
      return { error: 'Open this candidate’s profile, add and save the pre-screening interview notes, then set the status to Submitted.' };
    }
  }

  let transitioned = false;
  if (candidate.status !== parsed.data) {
    const updated = await prisma.candidate.updateMany({
      where: { id, status: candidate.status },
      data: { status: parsed.data },
    });
    if (!updated.count) return { error: 'This candidate’s status changed. Refresh and try again.' };
    transitioned = true;
  }

  if (parsed.data === 'submitted' && !transitioned && !candidate.clientProfileEmailSentAt) {
    return { error: 'This candidate is already submitted. Use the candidate profile to retry the client email if needed.' };
  }

  if (parsed.data === 'submitted' && transitioned && !candidate.clientProfileEmailSentAt) {
    const email = await sendCandidateProfileEmail(id);
    if (email.error) {
      revalidateCandidateViews(id);
      return email;
    }
  }

  revalidateCandidateViews(id);
  return {};
}

export async function saveCandidateScreeningNotes(id: string, notes: string): Promise<DeleteResult> {
  await requireAdmin();
  const parsed = candidateScreeningNotesSchema.safeParse(notes);
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? 'Invalid screening notes.' };
  try {
    await prisma.candidate.update({ where: { id }, data: { screeningNotes: parsed.data || null } });
  } catch (error) {
    if (isNotFound(error)) return { error: 'This candidate no longer exists.' };
    throw error;
  }
  revalidatePath(`${LIST_PATH}/${id}`);
  return {};
}

export async function retryCandidateProfileEmail(id: string): Promise<DeleteResult> {
  await requireAdmin();
  const result = await sendCandidateProfileEmail(id);
  if (!result.error) revalidatePath(`${LIST_PATH}/${id}`);
  return result;
}

export async function deleteCandidate(id: string): Promise<DeleteResult> {
  await requireAdmin();

  const candidate = await prisma.candidate.findUnique({ where: { id }, select: { cvPath: true } });
  await prisma.candidate.deleteMany({ where: { id } });
  await removeCv(candidate?.cvPath);

  revalidatePath(LIST_PATH);
  revalidatePath('/admin');
  return {};
}
