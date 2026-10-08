import { z } from 'zod';
import { defaultLocale, locales } from '@/types/locale';
import { Role } from '@/lib/generated/prisma/enums';

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

// ─── Jobs ────────────────────────────────────────────────────────────────────

export const JOB_STATUSES = ['draft', 'published', 'closed'] as const;
export type JobStatus = (typeof JOB_STATUSES)[number];

/** Rich-text fields, stored as (sanitized) HTML. */
export const JOB_RICH_TEXT_FIELDS = [
  'description',
  'responsibilities',
  'requirements',
  'benefits',
] as const;

const relationId = (label: string) =>
  z.string({ required_error: `Choose a ${label}.` }).uuid(`Choose a ${label}.`);

/** Required HTML: an empty editor still submits markup like "<p></p>". */
const richText = (label: string) =>
  z
    .string()
    .max(50_000, `${label} is too long.`)
    .refine((html) => html.replace(/<[^>]*>|&nbsp;/g, '').trim().length > 0, {
      message: `${label} is required.`,
    });

export const jobSchema = z.object({
  title: z.string().trim().min(1, 'Title is required.').max(200),
  salary: z.string().trim().min(1, 'Salary is required.').max(120),
  experience: z.string().trim().min(1, 'Experience is required.').max(120),
  cityId: relationId('city'),
  jobTypeId: relationId('job type'),
  jobCategoryId: relationId('category'),
  description: richText('Description'),
  responsibilities: richText('Responsibilities'),
  requirements: richText('Requirements'),
  benefits: richText('Benefits'),
  status: z.enum(JOB_STATUSES, { errorMap: () => ({ message: 'Choose a status.' }) }),
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

// ─── Candidates ──────────────────────────────────────────────────────────────

export const CANDIDATE_STATUSES = ['pending', 'rejected', 'success'] as const;
export type CandidateStatus = (typeof CANDIDATE_STATUSES)[number];

export const CV_MAX_BYTES = 10 * 1024 * 1024;
export const CV_EXTENSIONS = ['pdf', 'doc', 'docx'] as const;

const requiredText = (label: string, max: number) =>
  z.string().trim().min(1, `${label} is required.`).max(max, `${label} is too long.`);

export const candidateSchema = z.object({
  firstName: requiredText('First name', 120),
  lastName: requiredText('Last name', 120),
  phone: requiredText('Phone', 40).regex(/^[+\d][\d\s().-]{5,}$/, 'Enter a valid phone number.'),
  email: z.string().trim().min(1, 'Email is required.').max(255).email('Enter a valid email address.'),
  linkedin: z
    .string()
    .trim()
    .max(2048)
    .refine((v) => v === '' || /^https?:\/\//i.test(v), { message: 'Enter a full URL (https://…).' })
    .optional()
    .transform((v) => (v ? v : null)),
  coverLetter: optionalText(10_000),
  jobId: relationId('job'),
  status: z
    .enum(CANDIDATE_STATUSES, { errorMap: () => ({ message: 'Choose a status.' }) })
    .default('pending'),
});

export const candidateStatusSchema = z.enum(CANDIDATE_STATUSES);

/** The uploaded CV: required, pdf/doc/docx, at most CV_MAX_BYTES. */
export const cvFileSchema = z
  .instanceof(File, { message: 'Upload your CV.' })
  .refine((f) => f.size > 0, 'Upload your CV.')
  .refine((f) => f.size <= CV_MAX_BYTES, 'The CV must be 10 MB or smaller.')
  .refine(
    (f) => (CV_EXTENSIONS as readonly string[]).includes(f.name.split('.').pop()?.toLowerCase() ?? ''),
    'The CV must be a PDF, DOC or DOCX file.'
  );

// ─── Users ───────────────────────────────────────────────────────────────────

export const PASSWORD_MIN_LENGTH = 12;

const email = z.string().trim().toLowerCase().email('Enter a valid email address.').max(255);

const userFields = {
  email,
  name: optionalText(120),
  role: z.nativeEnum(Role, { errorMap: () => ({ message: 'Choose a role.' }) }),
};

export const userCreateSchema = z.object({
  ...userFields,
  password: z
    .string()
    .min(PASSWORD_MIN_LENGTH, `Use at least ${PASSWORD_MIN_LENGTH} characters.`)
    .max(200),
});

/** Blank password → undefined, i.e. keep the current one. */
export const userUpdateSchema = z.object({
  ...userFields,
  password: z
    .string()
    .max(200)
    .optional()
    .transform((v) => (v ? v : undefined))
    .refine((v) => v === undefined || v.length >= PASSWORD_MIN_LENGTH, {
      message: `Use at least ${PASSWORD_MIN_LENGTH} characters, or leave blank to keep the current password.`,
    }),
});
