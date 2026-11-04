import 'server-only';
import { randomUUID } from 'node:crypto';
import { getSupabaseAdmin } from '@/lib/supabase/admin';

export const CV_BUCKET = 'cv-uploads';

const SIGNED_URL_SECONDS = 60;

/** Stored content type and leading file signature per allowed extension (cvFileSchema). */
const CV_TYPES = new Map<string, { contentType: string; signature: number[] }>([
  ['pdf', { contentType: 'application/pdf', signature: [0x25, 0x50, 0x44, 0x46] }], // %PDF
  [
    'docx',
    {
      contentType: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      signature: [0x50, 0x4b, 0x03, 0x04], // ZIP
    },
  ],
  ['doc', { contentType: 'application/msword', signature: [0xd0, 0xcf, 0x11, 0xe0, 0xa1, 0xb1, 0x1a, 0xe1] }], // OLE2
]);

/** The file's contents don't match its extension. The message is safe to show the uploader. */
export class InvalidCvFileError extends Error {
  constructor() {
    super('This file is not a valid PDF, DOC or DOCX document.');
    this.name = 'InvalidCvFileError';
  }
}

/**
 * Uploads a CV and returns its object key and URL. Used by the admin candidate
 * form and the public application form. Callers validate the file first
 * (cvFileSchema); the contents are checked here because the name and type a
 * browser sends are attacker-controlled. Throws InvalidCvFileError on a mismatch.
 */
export async function uploadCv(file: File): Promise<{ path: string; url: string }> {
  const ext = file.name.split('.').pop()?.toLowerCase() ?? '';
  const type = CV_TYPES.get(ext);
  const bytes = Buffer.from(await file.arrayBuffer());
  if (!type || !type.signature.every((byte, i) => bytes[i] === byte)) throw new InvalidCvFileError();

  const path = `${new Date().getFullYear()}/${randomUUID()}.${ext}`;
  const supabase = getSupabaseAdmin();

  const { error } = await supabase.storage
    .from(CV_BUCKET)
    .upload(path, bytes, { contentType: type.contentType, upsert: false });
  if (error) throw error;

  return { path, url: supabase.storage.from(CV_BUCKET).getPublicUrl(path).data.publicUrl };
}

/** A CV's object key; rows saved before cvPath existed only have the URL. Null if it isn't in this bucket. */
export function cvObjectPath(candidate: { cvPath: string | null; cvUrl: string }): string | null {
  if (candidate.cvPath) return candidate.cvPath;
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL?.replace(/\/$/, '');
  const prefix = `${supabaseUrl}/storage/v1/object/public/${CV_BUCKET}/`;
  if (!supabaseUrl || !candidate.cvUrl.startsWith(prefix)) return null;
  return decodeURIComponent(candidate.cvUrl.slice(prefix.length));
}

/** A short-lived link to a CV. Callers must check the viewer's access first. */
export async function getCvSignedUrl(path: string): Promise<string> {
  const { data, error } = await getSupabaseAdmin()
    .storage.from(CV_BUCKET)
    .createSignedUrl(path, SIGNED_URL_SECONDS);
  if (error) throw error;
  return data.signedUrl;
}

/** Deletes stored CVs. Failures are logged, not thrown: the row is already gone and retrying can't help. */
export async function removeCvs(paths: string[]): Promise<void> {
  if (paths.length === 0) return;
  const { error } = await getSupabaseAdmin().storage.from(CV_BUCKET).remove(paths);
  if (error) console.error('Failed to remove CVs from Supabase Storage:', error);
}

export async function removeCv(path: string | null | undefined): Promise<void> {
  if (path) await removeCvs([path]);
}
