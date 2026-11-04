import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/**
 * Ids from URLs and forms are checked before querying; Postgres rejects a
 * malformed uuid with an error. Takes `unknown` because Server Action arguments
 * aren't type-checked at runtime: `{ not: "x" }` would be a Prisma filter.
 */
export function isUuid(value: unknown): boolean {
  return typeof value === 'string' && UUID_RE.test(value);
}
