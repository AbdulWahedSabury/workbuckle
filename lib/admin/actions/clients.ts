'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { prisma } from '@/lib/prisma';
import { requireAdmin } from '@/lib/admin/auth';
import { setFlash } from '@/lib/admin/flash-server';
import type { ActionState, DeleteResult } from '@/lib/admin/action-state';
import { deleteUnlessUsedByJobs } from '@/lib/admin/delete-guard';
import { formValues, isNotFound, validationError } from '@/lib/admin/form';
import { clientSchema } from '@/schemas/AdminSchemas';

const LIST_PATH = '/admin/clients';
function parse(formData: FormData) {
  const values = formValues(formData);
  return { values, result: clientSchema.safeParse(values) };
}
function refresh() {
  revalidatePath(LIST_PATH);
  revalidatePath('/admin/jobs');
  revalidatePath('/admin');
  revalidatePath('/jobs');
}
export async function createClient(_prev: ActionState, formData: FormData): Promise<ActionState> {
  await requireAdmin();
  const { values, result } = parse(formData);
  if (!result.success) return validationError(result.error, values);
  const client = await prisma.client.create({ data: result.data });
  refresh();
  await setFlash(`Client "${client.name}" created.`);
  redirect(LIST_PATH);
}
export async function updateClient(id: string, _prev: ActionState, formData: FormData): Promise<ActionState> {
  await requireAdmin();
  const { values, result } = parse(formData);
  if (!result.success) return validationError(result.error, values);
  try {
    await prisma.client.update({ where: { id }, data: result.data });
  } catch (error) {
    if (isNotFound(error)) return { message: 'This client no longer exists.', values };
    throw error;
  }
  refresh();
  await setFlash(`Client "${result.data.name}" updated.`);
  redirect(LIST_PATH);
}
export async function deleteClient(id: string): Promise<DeleteResult> {
  await requireAdmin();
  const result = await deleteUnlessUsedByJobs('client', { clientId: id }, (tx) =>
    tx.client.deleteMany({ where: { id } })
  );
  if (!result.error) refresh();
  return result;
}
