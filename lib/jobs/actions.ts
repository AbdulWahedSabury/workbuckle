'use server';

import { headers } from 'next/headers';
import { getLocale, getTranslations } from 'next-intl/server';
import { submitPublicApplication, type ApplicationResult } from '@/lib/jobs/submit-application';
import { defaultLocale } from '@/types/locale';

/**
 * Existing Workbuckle apply form action, shared with the public application API.
 * Refusals keep their detailed English message on the English site; other
 * languages get the translated message for the error code.
 */
export async function submitApplication(
  jobId: string,
  formData: FormData
): Promise<ApplicationResult> {
  const result = await submitPublicApplication(jobId, formData, await headers());
  if (result.ok) return result;

  const locale = await getLocale();
  if (locale === defaultLocale) return result;
  const t = await getTranslations({ locale, namespace: 'apply.errors' });
  return { ...result, message: t(result.code) };
}
