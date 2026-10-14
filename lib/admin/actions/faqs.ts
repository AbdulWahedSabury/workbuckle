'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { prisma } from '@/lib/prisma';
import { requireAdmin } from '@/lib/admin/auth';
import { setFlash } from '@/lib/admin/flash-server';
import type { ActionState } from '@/lib/admin/action-state';
import { formValues, isNotFound, validationError } from '@/lib/admin/form';
import { faqSchema } from '@/schemas/AdminSchemas';

const LIST_PATH = '/admin/faqs';

/** Public pages that render the FAQ section. */
const PUBLIC_PATHS = ['/', '/contact'];

function revalidateFaqs() {
  revalidatePath(LIST_PATH);
  for (const path of PUBLIC_PATHS) revalidatePath(path);
}

function parse(formData: FormData) {
  const values = formValues(formData);
  return { values, result: faqSchema.safeParse(values) };
}

export async function createFaq(_prev: ActionState, formData: FormData): Promise<ActionState> {
  await requireAdmin();

  const { values, result } = parse(formData);
  if (!result.success) return validationError(result.error, values);

  await prisma.faq.create({ data: result.data });

  revalidateFaqs();
  await setFlash('FAQ created.');
  redirect(LIST_PATH);
}

export async function updateFaq(
  id: string,
  _prev: ActionState,
  formData: FormData
): Promise<ActionState> {
  await requireAdmin();

  const { values, result } = parse(formData);
  if (!result.success) return validationError(result.error, values);

  try {
    await prisma.faq.update({ where: { id }, data: result.data });
  } catch (error) {
    if (isNotFound(error)) {
      return { message: 'This FAQ no longer exists.', values };
    }
    throw error;
  }

  revalidateFaqs();
  await setFlash('FAQ updated.');
  redirect(LIST_PATH);
}

export async function toggleFaqActive(id: string): Promise<void> {
  await requireAdmin();
  const faq = await prisma.faq.findUnique({ where: { id }, select: { isActive: true } });
  if (!faq) {
    await setFlash('This FAQ no longer exists.', 'error');
    return;
  }
  await prisma.faq.update({ where: { id }, data: { isActive: !faq.isActive } });
  await setFlash(faq.isActive ? 'FAQ is now hidden on the site.' : 'FAQ is now visible on the site.');
  revalidateFaqs();
}

export async function deleteFaq(id: string): Promise<void> {
  await requireAdmin();
  // deleteMany: already gone (e.g. deleted in another tab) is not an error.
  await prisma.faq.deleteMany({ where: { id } });
  revalidateFaqs();
}
