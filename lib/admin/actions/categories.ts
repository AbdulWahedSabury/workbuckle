'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { prisma } from '@/lib/prisma';
import { requireAdmin } from '@/lib/admin/auth';
import { createClient } from '@supabase/supabase-js';
import type { ActionState } from '@/lib/admin/action-state';
import {
  formValues,
  isNotFound,
  isUniqueViolation,
  slugify,
  validationError,
} from '@/lib/admin/form';
import { categoryNameField, jobCategorySchema } from '@/schemas/AdminSchemas';
import { defaultLocale, locales } from '@/types/locale';

const LIST_PATH = '/admin/categories';
const IMAGE_BUCKET = 'images';
const MAX_IMAGE_BYTES = 4 * 1024 * 1024; // keep below serverActions.bodySizeLimit

// Privileged server-side Supabase client configured to prevent Next fetch buffer detachment
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  {
    auth: { persistSession: false },
    global: {
      fetch: (url, options) =>
        fetch(url, {
          ...options,
          // @ts-expect-error duplex property is required for Node stream/buffer body payloads
          duplex: 'half',
        }),
    },
  }
);

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

  const ext = file.name.split('.').pop()?.toLowerCase() || 'bin';
  const imagePath = `categories/${Date.now()}-${crypto.randomUUID()}.${ext}`;

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
  
  // REST Endpoint for Supabase Storage object upload
  const uploadUrl = `${supabaseUrl}/storage/v1/object/${IMAGE_BUCKET}/${imagePath}`;

  // Use FormData to avoid ArrayBuffer detachment while ensuring proper upload payload
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

  // Get public URL using Supabase client helper
  const { data } = supabase.storage.from(IMAGE_BUCKET).getPublicUrl(imagePath);
  return { ok: true, image: { imageUrl: data.publicUrl, imagePath } };
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

export async function deleteCategory(id: string): Promise<void> {
  await requireAdmin();
  await prisma.jobCategory.deleteMany({ where: { id } });
  revalidatePath(LIST_PATH);
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