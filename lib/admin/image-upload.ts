import 'server-only';
import { getSupabaseAdmin } from '@/lib/supabase/admin';

const IMAGE_BUCKET = 'images';
const MAX_IMAGE_BYTES = 4 * 1024 * 1024; // keep below serverActions.bodySizeLimit

/** Accepted image types and the extension each is stored under (never taken from the client's file name). */
const IMAGE_EXTENSIONS: Record<string, string> = {
  'image/png': 'png',
  'image/jpeg': 'jpg',
  'image/webp': 'webp',
  'image/gif': 'gif',
  'image/avif': 'avif',
  'image/svg+xml': 'svg',
};

export type UploadResult =
  | { ok: true; image: { imageUrl: string; imagePath: string } | null }
  | { ok: false; error: string };

/** Public URL prefix of the bucket; same URL getPublicUrl() would return (bucket must be public). */
function publicBucketUrl(supabaseUrl: string): string {
  return `${supabaseUrl}/storage/v1/object/public/${IMAGE_BUCKET}/`;
}

/**
 * Uploads the file in `formData[field]` to the public Supabase `images` bucket under `folder/`.
 * Returns `image: null` when no file was chosen.
 */
export async function uploadImage(
  formData: FormData,
  field: string,
  folder: string
): Promise<UploadResult> {
  const file = formData.get(field);
  if (!(file instanceof File) || file.size === 0) return { ok: true, image: null };

  const ext = IMAGE_EXTENSIONS[file.type];
  if (!ext) {
    return { ok: false, error: 'Please choose a PNG, JPG, WebP, GIF, AVIF or SVG image.' };
  }
  if (file.size > MAX_IMAGE_BYTES) {
    return { ok: false, error: 'Images must be 4 MB or smaller.' };
  }

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!supabaseUrl || !serviceKey) {
    console.error('Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY');
    return { ok: false, error: 'Image upload is not configured.' };
  }

  const imagePath = `${folder}/${Date.now()}-${crypto.randomUUID()}.${ext}`;
  const uploadUrl = `${supabaseUrl}/storage/v1/object/${IMAGE_BUCKET}/${imagePath}`;

  const uploadPayload = new FormData();
  uploadPayload.append('file', file);

  try {
    const res = await fetch(uploadUrl, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${serviceKey}`,
        apikey: serviceKey,
        'x-upsert': 'false',
      },
      body: uploadPayload,
    });

    if (!res.ok) {
      const errData = await res.json().catch(() => ({}));
      console.error('Supabase Storage REST upload failed:', res.status, errData);
      return {
        ok: false,
        error: `Image upload failed: ${errData.message || errData.error || res.statusText}`,
      };
    }
  } catch (err) {
    console.error('Image upload failed:', err);
    return { ok: false, error: 'Image upload failed due to a network error.' };
  }

  return { ok: true, image: { imageUrl: `${publicBucketUrl(supabaseUrl)}${imagePath}`, imagePath } };
}

/**
 * The object key of an image this bucket serves, from its public URL; null for
 * anything else (an external URL, a /public path), which must not be removed.
 */
export function imagePathFromUrl(url: string | null | undefined): string | null {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  if (!url || !supabaseUrl) return null;
  const prefix = publicBucketUrl(supabaseUrl);
  return url.startsWith(prefix) ? decodeURIComponent(url.slice(prefix.length)) : null;
}

/** Deletes an uploaded image. Failures are logged, not thrown: a leftover file is harmless. */
export async function removeImage(imagePath?: string | null): Promise<void> {
  if (!imagePath) return;

  try {
    const supabase = getSupabaseAdmin();
    const { error } = await supabase.storage.from(IMAGE_BUCKET).remove([imagePath]);
    if (error) {
      console.error('Failed to remove image from Supabase Storage:', error);
    }
  } catch (err) {
    console.error('Error removing image:', err);
  }
}
