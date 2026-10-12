'use server';

import { revalidatePath } from 'next/cache';
import { prisma } from '@/lib/prisma';
import { requireAdmin } from '@/lib/admin/auth';
import type { ActionState } from '@/lib/admin/action-state';
import { formValues, validationError } from '@/lib/admin/form';
import { siteSettingSchema } from '@/schemas/AdminSchemas';
import { removeImage, uploadImage } from '@/lib/admin/image-upload';
import { SITE_SETTING_ID } from '../siteSetting';

const LOGO_FOLDER = 'settings';

export async function updateSiteSettings(
  _prev: ActionState,
  formData: FormData
): Promise<ActionState> {
  await requireAdmin();

  const values = formValues(formData);
  const result = siteSettingSchema.safeParse(values);
  if (!result.success) return validationError(result.error, values);

  // A newly chosen logo replaces the current one (sent as the hidden logoUrl field).
  const upload = await uploadImage(formData, 'logoFile', LOGO_FOLDER);
  if (!upload.ok) return { errors: { logoUrl: [upload.error] }, values };
  const data = upload.image ? { ...result.data, logoUrl: upload.image.imageUrl } : result.data;

  try {
    await prisma.siteSetting.upsert({
      where: { id: SITE_SETTING_ID },
      create: { id: SITE_SETTING_ID, ...data },
      update: data,
    });
  } catch (error) {
    await removeImage(upload.image?.imagePath);
    throw error;
  }

  // Settings can be read anywhere on the site, so refresh every route.
  revalidatePath('/', 'layout');
  return { message: 'Settings saved.' };
}
