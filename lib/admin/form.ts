import type { z } from 'zod';
import { Prisma } from '@/lib/generated/prisma/client';
import type { ActionState } from '@/lib/admin/action-state';

/** FormData → plain object of strings (drops Next's internal `$ACTION_` keys). */
export function formValues(formData: FormData): Record<string, string> {
  const values: Record<string, string> = {};
  for (const [key, value] of formData.entries()) {
    if (typeof value === 'string' && !key.startsWith('$ACTION_')) {
      values[key] = value;
    }
  }
  return values;
}

export function validationError(
  error: z.ZodError,
  values: Record<string, string>
): ActionState {
  return {
    message: 'Please fix the highlighted fields.',
    errors: error.flatten().fieldErrors as ActionState['errors'],
    values,
  };
}

export function isUniqueViolation(error: unknown): boolean {
  return (
    error instanceof Prisma.PrismaClientKnownRequestError &&
    error.code === 'P2002'
  );
}

export function isNotFound(error: unknown): boolean {
  return (
    error instanceof Prisma.PrismaClientKnownRequestError &&
    error.code === 'P2025'
  );
}

/** "Software Engineering" → "software-engineering" (handles German umlauts). */
export function slugify(input: string): string {
  return input
    .toLowerCase()
    .replace(/ä/g, 'ae')
    .replace(/ö/g, 'oe')
    .replace(/ü/g, 'ue')
    .replace(/ß/g, 'ss')
    .normalize('NFKD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 140);
}
