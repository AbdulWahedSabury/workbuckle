import { z } from 'zod';
import { defaultLocale, locales } from '@/types/locale';

const SLUG_RE = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

const slug = z
  .string()
  .trim()
  .min(1, 'Slug is required.')
  .max(140)
  .regex(SLUG_RE, 'Use lowercase letters, numbers and single hyphens only.');

/** Empty string → null, so optional text columns store NULL rather than "". */
const optionalText = (max: number) =>
  z
    .string()
    .trim()
    .max(max)
    .optional()
    .transform((v) => (v ? v : null));

/** Hosted URL (https://…) or a path under /public (/images/…). */
const optionalImageUrl = z
  .string()
  .trim()
  .max(2048)
  .refine((v) => v === '' || v.startsWith('/') || /^https?:\/\//.test(v), {
    message: 'Enter a full URL (https://…) or a path starting with /.',
  })
  .optional()
  .transform((v) => (v ? v : null));

/** HTML checkboxes send "on" when checked and nothing when unchecked. */
const checkbox = z.preprocess((v) => v === 'on' || v === 'true', z.boolean());

// ─── Job categories ──────────────────────────────────────────────────────────

/** Form field name for a category's name in a given locale, e.g. "name_de". */
export const categoryNameField = (locale: string) => `name_${locale}`;

export const jobCategorySchema = z.object({
  slug,
  imageUrl: optionalImageUrl,
  isActive: checkbox,
  sortOrder: z.coerce.number().int().min(0).max(100_000).default(0),
  ...Object.fromEntries(
    locales.map((locale) => [
      categoryNameField(locale),
      locale === defaultLocale
        ? z.string().trim().min(1, 'Name is required.').max(120)
        : z.string().trim().max(120).optional(),
    ])
  ),
});

// ─── Cities ──────────────────────────────────────────────────────────────────

export const citySchema = z.object({
  name: z.string().trim().min(1, 'Name is required.').max(120),
  slug,
  state: optionalText(120),
});

// ─── Job types ───────────────────────────────────────────────────────────────

export const jobTypeSchema = z.object({
  name: z.string().trim().min(1, 'Name is required.').max(120),
  slug,
});

// ─── Site settings ───────────────────────────────────────────────────────────

export const siteSettingSchema = z.object({
  siteName: z.string().trim().min(1, 'Site name is required.').max(120),
  contactEmail: z
    .string()
    .trim()
    .max(255)
    .refine((v) => v === '' || z.string().email().safeParse(v).success, {
      message: 'Enter a valid email address.',
    })
    .optional()
    .transform((v) => (v ? v : null)),
  contactPhone: optionalText(40),
  logoUrl: optionalImageUrl,
  faviconUrl: optionalImageUrl,
  maintenanceMode: checkbox,
  maintenanceMessage: optionalText(2000),
});
