'use server';

import { randomUUID } from 'node:crypto';
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { prisma } from '@/lib/prisma';
import { requireAdmin } from '@/lib/admin/auth';
import type { ActionState, DeleteResult } from '@/lib/admin/action-state';
import { formValues, isNotFound, validationError } from '@/lib/admin/form';
import { getSupabaseAdmin } from '@/lib/supabase/admin';
import { candidateSchema, candidateStatusSchema, cvFileSchema } from '@/schemas/AdminSchemas';

const LIST_PATH = '/admin/candidates';
const CV_BUCKET = 'cv-uploads';

/** Uploads the CV and returns its object key and public URL (the bucket must be public). */
async function uploadCv(file: File): Promise<{ path: string; url: string }> {
  const ext = file.name.split('.').pop()?.toLowerCase() ?? 'pdf';
  const path = `${new Date().getFullYear()}/${randomUUID()}.${ext}`;
  const supabase = getSupabaseAdmin();

  const { error } = await supabase.storage
    .from(CV_BUCKET)
    .upload(path, Buffer.from(await file.arrayBuffer()), {
      contentType: file.type || 'application/octet-stream',
      upsert: false,
    });
  if (error) throw error;

  return { path, url: supabase.storage.from(CV_BUCKET).getPublicUrl(path).data.publicUrl };
}

async function removeCv(path: string | null) {
  if (!path) return;
  const { error } = await getSupabaseAdmin().storage.from(CV_BUCKET).remove([path]);
  if (error) console.error('Failed to remove CV from Supabase Storage:', error);
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
      ? { message: 'Please fix the highlighted fields.', values }
      : validationError(result.error, values);
    if (!cv.success) state.errors = { ...state.errors, cv: [cv.error.issues[0].message] };
    return state;
  }

  const job = await prisma.job.findUnique({ where: { id: result.data.jobId }, select: { id: true } });
  if (!job) return { errors: { jobId: ['This job no longer exists.'] }, values };

  let upload: { path: string; url: string };
  try {
    upload = await uploadCv(cv.data);
  } catch (error) {
    console.error('Supabase Storage CV upload failed:', error);
    return { message: 'Could not upload the CV. Please try again.', values };
  }

  try {
    await prisma.$transaction(async (tx) => {
      await tx.candidate.create({
        data: { ...result.data, cvUrl: upload.url, cvPath: upload.path },
      });
      if (result.data.status === 'success') {
        await tx.job.update({ where: { id: result.data.jobId }, data: { status: 'closed' } });
      }
    });
  } catch (error) {
    // Don't leave an orphaned file behind when the row didn't save.
    await removeCv(upload.path);
    throw error;
  }

  revalidatePath(LIST_PATH);
  revalidatePath('/admin/jobs');
  revalidatePath('/admin');
  redirect(LIST_PATH);
}

/** Moves a candidate between pending / rejected / success. */
export async function updateCandidateStatus(
  id: string,
  status: string
): Promise<DeleteResult> {
  await requireAdmin();

  const parsed = candidateStatusSchema.safeParse(status);
  if (!parsed.success) return { error: 'Invalid status.' };

  try {
    await prisma.$transaction(async (tx) => {
      const candidate = await tx.candidate.update({
        where: { id },
        data: { status: parsed.data },
        select: { jobId: true },
      });
      // Hiring someone fills the position.
      if (parsed.data === 'success') {
        await tx.job.update({ where: { id: candidate.jobId }, data: { status: 'closed' } });
      }
    });
  } catch (error) {
    if (isNotFound(error)) return { error: 'This candidate no longer exists.' };
    throw error;
  }

  revalidatePath(LIST_PATH);
  revalidatePath(`${LIST_PATH}/${id}`);
  revalidatePath('/admin/jobs');
  revalidatePath('/admin');
  return {};
}

export async function deleteCandidate(id: string): Promise<DeleteResult> {
  await requireAdmin();

  const candidate = await prisma.candidate.findUnique({ where: { id }, select: { cvPath: true } });
  await prisma.candidate.deleteMany({ where: { id } });
  await removeCv(candidate?.cvPath ?? null);

  revalidatePath(LIST_PATH);
  revalidatePath('/admin');
  return {};
}
