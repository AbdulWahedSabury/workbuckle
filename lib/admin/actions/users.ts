'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { prisma } from '@/lib/prisma';
import { requireAdmin } from '@/lib/admin/auth';
import type { ActionState, DeleteResult } from '@/lib/admin/action-state';
import { formValues, isNotFound, isUniqueViolation, validationError } from '@/lib/admin/form';
import { hashPassword } from '@/lib/auth/password';
import { Role } from '@/lib/generated/prisma/enums';
import { userCreateSchema, userUpdateSchema } from '@/schemas/AdminSchemas';

const LIST_PATH = '/admin/users';

/** Form values to echo back after a failed submit, minus the password. */
function parse(formData: FormData) {
  const { password, ...values } = formValues(formData);
  return { values, input: { ...values, password } };
}

export async function createUser(_prev: ActionState, formData: FormData): Promise<ActionState> {
  await requireAdmin();

  const { values, input } = parse(formData);
  const result = userCreateSchema.safeParse(input);
  if (!result.success) return validationError(result.error, values);

  const { password, ...data } = result.data;
  try {
    await prisma.user.create({ data: { ...data, passwordHash: await hashPassword(password) } });
  } catch (error) {
    if (isUniqueViolation(error)) {
      return { errors: { email: ['A user with this email already exists.'] }, values };
    }
    throw error;
  }

  revalidatePath(LIST_PATH);
  redirect(LIST_PATH);
}

export async function updateUser(
  id: string,
  _prev: ActionState,
  formData: FormData
): Promise<ActionState> {
  const admin = await requireAdmin();

  const { values, input } = parse(formData);
  const result = userUpdateSchema.safeParse(input);
  if (!result.success) return validationError(result.error, values);

  const { password, ...data } = result.data;
  // The acting admin always stays an admin, so the panel can't be left
  // without one.
  if (id === admin.id && data.role !== Role.ADMIN) {
    return { errors: { role: ["You can't remove your own admin access."] }, values };
  }

  try {
    await prisma.user.update({
      where: { id },
      data: { ...data, ...(password && { passwordHash: await hashPassword(password) }) },
    });
  } catch (error) {
    if (isUniqueViolation(error)) {
      return { errors: { email: ['A user with this email already exists.'] }, values };
    }
    if (isNotFound(error)) {
      return { message: 'This user no longer exists.', values };
    }
    throw error;
  }

  revalidatePath(LIST_PATH);
  redirect(LIST_PATH);
}

export async function deleteUser(id: string): Promise<DeleteResult> {
  const admin = await requireAdmin();
  if (id === admin.id) return { error: "You can't delete your own account." };

  // Accounts and sessions cascade with the user.
  await prisma.user.deleteMany({ where: { id } });
  revalidatePath(LIST_PATH);
  return {};
}
