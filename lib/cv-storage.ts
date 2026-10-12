import 'server-only';
import { randomUUID } from 'node:crypto';
import { getSupabaseAdmin } from '@/lib/supabase/admin';

const CV_BUCKET = 'cv-uploads';

/**
 * Uploads a CV and returns its object key and public URL (the bucket must be
 * public). Used by the admin candidate form and the public application form.
 * Callers validate the file first (cvFileSchema).
 */
export async function uploadCv(file: File): Promise<{ path: string; url: string }> {
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

/** Deletes a stored CV. Failures are logged, not thrown: a leftover file is harmless. */
export async function removeCv(path: string | null | undefined): Promise<void> {
  if (!path) return;
  const { error } = await getSupabaseAdmin().storage.from(CV_BUCKET).remove([path]);
  if (error) console.error('Failed to remove CV from Supabase Storage:', error);
}
