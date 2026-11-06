'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { prisma } from '@/lib/prisma';
import { requireAdmin } from '@/lib/admin/auth';
import { setFlash } from '@/lib/admin/flash-server';
import type { ActionState } from '@/lib/admin/action-state';
import { FIX_FIELDS_MESSAGE, formValues, isNotFound, validationError } from '@/lib/admin/form';
import { parseTranslations } from '@/lib/admin/translations';
import { imagePathFromUrl, removeImage, uploadImage } from '@/lib/admin/image-upload';
import { campaignSchema, campaignTranslationSchema } from '@/schemas/AdminSchemas';

const LIST_PATH = '/admin/campaigns';
const IMAGE_FOLDER = 'campaigns';

function parse(formData: FormData) {
  const values = formValues(formData);
  return {
    values,
    result: campaignSchema.safeParse(values),
    translations: parseTranslations(campaignTranslationSchema, values),
  };
}

/**
 * Validates the form (English and translated fields) and uploads a newly
 * chosen image. A chosen file wins over the path/URL typed into `img`.
 */
async function prepare(formData: FormData) {
  const { values, result, translations } = parse(formData);
  if (!result.success || !translations.success) {
    const errors = {
      ...(result.success ? {} : validationError(result.error, values).errors),
      ...(translations.success ? {} : translations.errors),
    };
    return { error: { message: FIX_FIELDS_MESSAGE, errors, values } };
  }

  const upload = await uploadImage(formData, 'imgFile', IMAGE_FOLDER);
  if (!upload.ok) return { error: { errors: { imgFile: [upload.error] }, values } };

  const data = upload.image ? { ...result.data, img: upload.image.imageUrl } : result.data;
  return { values, data, translations, uploadedPath: upload.image?.imagePath ?? null };
}

export async function createCampaign(
  _prev: ActionState,
  formData: FormData
): Promise<ActionState> {
  await requireAdmin();

  const prepared = await prepare(formData);
  if (prepared.error) return prepared.error;

  try {
    await prisma.campaign.create({
      data: { ...prepared.data, translations: { create: prepared.translations.rows } },
    });
  } catch (error) {
    await removeImage(prepared.uploadedPath);
    throw error;
  }

  revalidatePath(LIST_PATH);
  await setFlash(`Campaign "${prepared.data.title}" created.`);
  redirect(LIST_PATH);
}

export async function updateCampaign(
  id: string,
  _prev: ActionState,
  formData: FormData
): Promise<ActionState> {
  await requireAdmin();

  const prepared = await prepare(formData);
  if (prepared.error) return prepared.error;
  const { values, data, translations, uploadedPath } = prepared;

  const previous = await prisma.campaign.findUnique({ where: { id }, select: { img: true } });

  try {
    await prisma.$transaction([
      prisma.campaign.update({ where: { id }, data }),
      ...translations.rows.map(({ locale, ...text }) =>
        prisma.campaignTranslation.upsert({
          where: { campaignId_locale: { campaignId: id, locale } },
          create: { campaignId: id, locale, ...text },
          update: text,
        })
      ),
      // Every field of a language left blank: show the English text again.
      prisma.campaignTranslation.deleteMany({
        where: { campaignId: id, locale: { in: translations.emptyLocales } },
      }),
    ]);
  } catch (error) {
    await removeImage(uploadedPath);
    if (isNotFound(error)) {
      return { message: 'This campaign no longer exists.', values };
    }
    throw error;
  }

  // The replaced image is no longer referenced; only files in our bucket are removed.
  if (previous?.img && previous.img !== data.img) {
    await removeImage(imagePathFromUrl(previous.img));
  }

  revalidatePath(LIST_PATH);
  revalidatePath('/admin/jobs');
  await setFlash(`Campaign "${data.title}" updated.`);
  redirect(LIST_PATH);
}

/** Deletes the campaign; its jobs stay, unassigned (ON DELETE SET NULL). */
export async function deleteCampaign(id: string): Promise<void> {
  await requireAdmin();

  let img: string | null = null;
  try {
    ({ img } = await prisma.campaign.delete({ where: { id }, select: { img: true } }));
  } catch (error) {
    // Already gone, e.g. deleted in another tab.
    if (!isNotFound(error)) throw error;
  }

  await removeImage(imagePathFromUrl(img));
  revalidatePath(LIST_PATH);
  revalidatePath('/admin/jobs');
}
