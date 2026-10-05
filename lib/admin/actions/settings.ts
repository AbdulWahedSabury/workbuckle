'use server';

import { revalidatePath } from 'next/cache';
import { prisma } from '@/lib/prisma';
import { requireAdmin } from '@/lib/admin/auth';
import type { ActionState } from '@/lib/admin/action-state';
import { formValues, validationError } from '@/lib/admin/form';
import { SITE_SETTING_ID } from '@/lib/admin/queries';
import { siteSettingSchema } from '@/schemas/AdminSchemas';

export async function updateSiteSettings(
  _prev: ActionState,
  formData: FormData
): Promise<ActionState> {
  await requireAdmin();

  const values = formValues(formData);
  const result = siteSettingSchema.safeParse(values);
  if (!result.success) return validationError(result.error, values);

  await prisma.siteSetting.upsert({
    where: { id: SITE_SETTING_ID },
    create: { id: SITE_SETTING_ID, ...result.data },
    update: result.data,
  });

  // Settings can be read anywhere on the site, so refresh every route.
  revalidatePath('/', 'layout');
  return { message: 'Settings saved.' };
}
