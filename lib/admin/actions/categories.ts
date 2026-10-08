'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { prisma } from '@/lib/prisma';
import { requireAdmin } from '@/lib/admin/auth';
import type { ActionState, DeleteResult } from '@/lib/admin/action-state';
import { deleteUnlessUsedByJobs } from '@/lib/admin/delete-guard';
import {
  formValues,
  isNotFound,
  isUniqueViolation,
  slugify,
  validationError,
} from '@/lib/admin/form';
import { categoryNameField, jobCategorySchema } from '@/schemas/AdminSchemas';
import { defaultLocale, locales } from '@/types/locale';
import { getSupabaseAdmin } from '@/lib/supabase/admin';

const LIST_PATH = '/admin/categories';
const IMAGE_BUCKET = 'images';
const MAX_IMAGE_BYTES = 4 * 1024 * 1024; // keep below serverActions.bodySizeLimit


function parse(formData: FormData) {
  const values = formValues(formData);
  const input = {
    ...values,
    imageUrl: values.existingImageUrl,
    slug: values.slug?.trim() || slugify(values[categoryNameField(defaultLocale)] ?? ''),
  };
  return { values, result: jobCategorySchema.safeParse(input) };
}

function translationRows(data: Record<string, unknown>) {
  return locales.flatMap((locale) => {
    const name = data[categoryNameField(locale)];
    return typeof name === 'string' && name ? [{ locale, name }] : [];
  });
}
type UploadResult =
  | { ok: true; image: { imageUrl: string; imagePath: string } | null }
  | { ok: false; error: string };

async function uploadImage(formData: FormData): Promise<UploadResult> {
  const file = formData.get('imageFile');
  if (!(file instanceof File) || file.size === 0) return { ok: true, image: null };

  if (!file.type.startsWith('image/')) {
    return { ok: false, error: 'Please choose an image file.' };
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

  const ext = file.name.split('.').pop()?.toLowerCase() || 'bin';
  const imagePath = `categories/${Date.now()}-${crypto.randomUUID()}.${ext}`;
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
    console.error('Category image upload failed:', err);
    return { ok: false, error: 'Image upload failed due to a network error.' };
  }

  // Same URL getPublicUrl() would return (bucket must be public)
  const imageUrl = `${supabaseUrl}/storage/v1/object/public/${IMAGE_BUCKET}/${imagePath}`;
  return { ok: true, image: { imageUrl, imagePath } };
}
export async function createCategory(
  _prev: ActionState,
  formData: FormData
): Promise<ActionState> {
  await requireAdmin();

  const { values, result } = parse(formData);
  if (!result.success) return validationError(result.error, values);
  const { slug, isActive, sortOrder } = result.data;

  const upload = await uploadImage(formData);
  if (!upload.ok) return { errors: { imageUrl: [upload.error] }, values };

  try {
    await prisma.jobCategory.create({
      data: {
        slug,
        imageUrl: upload.image?.imageUrl ?? null,
        imagePath: upload.image?.imagePath ?? null,
        isActive,
        sortOrder,
        translations: { create: translationRows(result.data) },
      },
    });
  } catch (error) {
    await removeImage(upload.image?.imagePath);
    if (isUniqueViolation(error)) {
      return { errors: { slug: ['This slug is already in use.'] }, values };
    }
    throw error;
  }

  revalidatePath(LIST_PATH);
  redirect(LIST_PATH);
}
async function removeImage(imagePath?: string | null): Promise<void> {
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
export async function updateCategory(
  id: string,
  _prev: ActionState,
  formData: FormData
): Promise<ActionState> {
  await requireAdmin();

  const { values, result } = parse(formData);
  if (!result.success) return validationError(result.error, values);
  const { slug, imageUrl, isActive, sortOrder } = result.data;
  const rows = translationRows(result.data);

  const upload = await uploadImage(formData);
  if (!upload.ok) return { errors: { imageUrl: [upload.error] }, values };
  const image = upload.image ?? { imageUrl };

  try {
    await prisma.$transaction([
      prisma.jobCategory.update({
        where: { id },
        data: { slug, ...image, isActive, sortOrder },
      }),
      ...rows.map(({ locale, name }) =>
        prisma.jobCategoryTranslation.upsert({
          where: { categoryId_locale: { categoryId: id, locale } },
          create: { categoryId: id, locale, name },
          update: { name },
        })
      ),
      prisma.jobCategoryTranslation.deleteMany({
        where: { categoryId: id, locale: { notIn: rows.map((r) => r.locale) } },
      }),
    ]);
  } catch (error) {
    await removeImage(upload.image?.imagePath);
    if (isUniqueViolation(error)) {
      return { errors: { slug: ['This slug is already in use.'] }, values };
    }
    if (isNotFound(error)) {
      return { message: 'This category no longer exists.', values };
    }
    throw error;
  }

  revalidatePath(LIST_PATH);
  redirect(LIST_PATH);
}

export async function deleteCategory(id: string): Promise<DeleteResult> {
  await requireAdmin();
  const result = await deleteUnlessUsedByJobs('category', { jobCategoryId: id }, (tx) =>
    tx.jobCategory.deleteMany({ where: { id } })
  );
  if (!result.error) revalidatePath(LIST_PATH);
  return result;
}

export async function toggleCategoryActive(id: string): Promise<void> {
  await requireAdmin();
  const category = await prisma.jobCategory.findUnique({
    where: { id },
    select: { isActive: true },
  });
  if (!category) return;
  await prisma.jobCategory.update({
    where: { id },
    data: { isActive: !category.isActive },
  });
  revalidatePath(LIST_PATH);
}