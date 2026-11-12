import { z } from 'zod';
import { defaultLocale, locales } from '@/types/locale';
import { Role } from '@/lib/generated/prisma/enums';
import { fromZonedInputValue } from '@/lib/datetime';

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
  // `//host` and `/\host` are other sites to a browser, not paths under /public.
  .refine((v) => v === '' || /^\/(?![/\\])/.test(v) || /^https?:\/\//.test(v), {
    message: 'Enter a full URL (https://…) or a path starting with /.',
  })
  .optional()
  .transform((v) => (v ? v : null));

/** External link, e.g. a social profile (https://…). */
const optionalLinkUrl = z
  .string()
  .trim()
  .max(2048)
  .refine((v) => v === '' || /^https?:\/\//.test(v), {
    message: 'Enter a full URL starting with https://.',
  })
  .optional()
  .transform((v) => (v ? v : null));

/** HTML checkboxes send "on" when checked and nothing when unchecked. */
const checkbox = z.preprocess((v) => v === 'on' || v === 'true', z.boolean());

// ─── Translations ────────────────────────────────────────────────────────────

/** Languages that get optional translated fields in admin forms (all but English). */
export const TRANSLATION_LOCALES = locales.filter((locale) => locale !== defaultLocale);

/** Form field name for a translated value, e.g. "title_el". */
export const translationField = (field: string, locale: string) => `${field}_${locale}`;

/** Form field name in `locale`: the plain name for English ("title"), suffixed otherwise ("title_el"). */
export const localizedFieldName = (field: string, locale: string) =>
  locale === defaultLocale ? field : translationField(field, locale);

// ─── Job categories ──────────────────────────────────────────────────────────

/** Form field name for a category's name in a given locale, e.g. "name_de". */
export const categoryNameField = (locale: string) => `name_${locale}`;

/** Lucide icon name in kebab-case, e.g. "code-xml"; empty → null. */
const optionalIconName = z
  .string()
  .trim()
  .max(64)
  .refine((v) => v === '' || SLUG_RE.test(v), {
    message: 'Pick an icon from the list (lowercase name like "code-xml").',
  })
  .optional()
  .transform((v) => (v ? v : null));

export const jobCategorySchema = z.object({
  slug,
  imageUrl: optionalImageUrl,
  icon: optionalIconName,
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

// ─── Positions ───────────────────────────────────────────────────────────────

/** A role jobs hire for and the talent pool filters by (Waiter, Bartender, ...). */
export const positionSchema = z.object({
  name: z.string().trim().min(1, 'Name is required.').max(120),
  slug,
});

/** The positions an admin sets on a person's profile: any number, no duplicates. */
export const personPositionsSchema = z
  .array(z.string().uuid('Choose a valid position.'))
  .max(200)
  .transform((ids) => [...new Set(ids)]);

// ─── Job types ───────────────────────────────────────────────────────────────

export const jobTypeSchema = z.object({
  name: z.string().trim().min(1, 'Name is required.').max(120),
  slug,
});

/** One language's optional job type name (form field name_el, ...). Blank = use English. */
export const jobTypeTranslationSchema = z.object({
  name: z.string().trim().max(120, 'Name is too long.'),
});

export const JOB_TYPE_TRANSLATABLE_FIELDS = Object.keys(jobTypeTranslationSchema.shape) as (keyof z.infer<
  typeof jobTypeTranslationSchema
>)[];

// ─── FAQs ────────────────────────────────────────────────────────────────────

export const faqSchema = z.object({
  question: z.string().trim().min(1, 'Question is required.').max(300),
  answer: z.string().trim().min(1, 'Answer is required.').max(5000),
  isActive: checkbox,
  sortOrder: z.coerce.number().int().min(0).max(100_000).default(0),
});

/** One language's optional FAQ text (form fields question_el, answer_el, ...). */
export const faqTranslationSchema = z.object({
  question: z.string().trim().max(300, 'Question is too long.'),
  answer: z.string().trim().max(5000, 'Answer is too long.'),
});

export const FAQ_TRANSLATABLE_FIELDS = Object.keys(faqTranslationSchema.shape) as (keyof z.infer<
  typeof faqTranslationSchema
>)[];

// ─── Campaigns ───────────────────────────────────────────────────────────────

export const campaignSchema = z.object({
  title: z.string().trim().min(1, 'Title is required.').max(200),
  img: optionalImageUrl,
  imageAlt: optionalText(255),
  intro: z.string().trim().min(1, 'Intro is required.').max(5000),
});

/** One language's optional campaign text (form fields title_el, intro_el, imageAlt_el). Blank = use English. */
export const campaignTranslationSchema = z.object({
  title: z.string().trim().max(200, 'Title is too long.'),
  intro: z.string().trim().max(5000, 'Intro is too long.'),
  imageAlt: z.string().trim().max(255, 'Image description is too long.'),
});

export const CAMPAIGN_TRANSLATABLE_FIELDS = Object.keys(campaignTranslationSchema.shape) as (keyof z.infer<
  typeof campaignTranslationSchema
>)[];

// ── Clients ─────────────────────────────────────────────────────────────────────────────────────

export const clientSchema = z.object({
  name: z.string().trim().min(1, 'Client name is required.').max(160),
  contactName: optionalText(160),
  email: z
    .string()
    .trim()
    .max(255)
    .refine((v) => v === '' || z.string().email().safeParse(v).success, {
      message: 'Enter a valid email address.',
    })
    .optional()
    .transform((v) => (v ? v : null)),
  phone: optionalText(40),
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
  totalPositions: z.coerce
    .number({ invalid_type_error: 'Enter a number of openings.' })
    .int('Enter a whole number.')
    .min(1, 'At least 1 opening.')
    .max(10_000, 'Too many openings.')
    .default(1),
  clientId: relationId('client'),
  cityId: relationId('city'),
  jobTypeId: relationId('job type'),
  jobCategoryId: relationId('category'),
  positionId: relationId('position'),
  // Optional: blank ("No campaign") → null.
  campaignId: z
    .string()
    .trim()
    .optional()
    .transform((v) => (v ? v : null))
    .refine((v) => v === null || z.string().uuid().safeParse(v).success, {
      message: 'Choose a campaign.',
    }),
  description: richText('Description'),
  responsibilities: richText('Responsibilities'),
  requirements: richText('Requirements'),
  benefits: richText('Benefits'),
  status: z.enum(JOB_STATUSES, { errorMap: () => ({ message: 'Choose a status.' }) }),
});

/** True when rich-text HTML has no visible text (an empty editor still sends "<p></p>"). */
export const isBlankRichText = (html: string) => html.replace(/<[^>]*>|&nbsp;/g, '').trim().length === 0;

/** One language's optional job text (form fields title_el, description_el, ...). Blank = use English. */
export const jobTranslationSchema = z.object({
  title: z.string().trim().max(200, 'Title is too long.'),
  salary: z.string().trim().max(120, 'Salary is too long.'),
  experience: z.string().trim().max(120, 'Experience is too long.'),
  description: z.string().max(50_000, 'Description is too long.'),
  responsibilities: z.string().max(50_000, 'Responsibilities is too long.'),
  requirements: z.string().max(50_000, 'Requirements is too long.'),
  benefits: z.string().max(50_000, 'Benefits is too long.'),
});

export const JOB_TRANSLATABLE_FIELDS = Object.keys(jobTranslationSchema.shape) as (keyof z.infer<
  typeof jobTranslationSchema
>)[];

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
  metaTitle: optionalText(120),
  metaDescription: optionalText(320),
  facebookUrl: optionalLinkUrl,
  linkedinUrl: optionalLinkUrl,
  instagramUrl: optionalLinkUrl,
  about: optionalText(5000),
  maintenanceMode: checkbox,
  maintenanceMessage: optionalText(2000),
});

// ─── Candidates ──────────────────────────────────────────────────────────────

/** The person's availability. hired is set only by the hire action. */
export const CANDIDATE_STATUSES = ['open', 'hired', 'inactive'] as const;
export type CandidateStatus = (typeof CANDIDATE_STATUSES)[number];
/** What an admin can set by hand; a hired candidate stays hired. */
export const candidateManualStatusSchema = z.enum(['open', 'inactive']);

/** One application's stage. Order = pipeline order. */
export const APPLICATION_STATUSES = [
  'pending',
  'under_review',
  'shortlisted',
  'submitted',
  'interview',
  'rejected',
  'hired',
  'cancelled',
] as const;
export type ApplicationStatus = (typeof APPLICATION_STATUSES)[number];

/**
 * Statuses an admin picks by hand. hired needs the explicit hire action, cancelled
 * is automatic, and interview is set only by the employer recording one (saveInterview).
 */
export const MANUAL_APPLICATION_STATUSES = [
  'pending',
  'under_review',
  'shortlisted',
  'submitted',
  'rejected',
] as const satisfies readonly ApplicationStatus[];
export type ManualApplicationStatus = (typeof MANUAL_APPLICATION_STATUSES)[number];

/** Still in the running: cancelled automatically when the candidate is hired for another job. */
export const ACTIVE_APPLICATION_STATUSES = [
  'pending',
  'under_review',
  'shortlisted',
  'submitted',
  'interview',
] as const satisfies readonly ApplicationStatus[];

/** Reaching any of these means the employer has the candidate: it sets submittedAt. */
export const EMPLOYER_STAGES = ['submitted', 'interview', 'hired'] as const satisfies readonly ApplicationStatus[];

/** Where a client user may still hire or reject: anything else was decided, or moved back by the agency. */
export const EMPLOYER_DECISION_STAGES = ['submitted', 'interview'] as const satisfies readonly ApplicationStatus[];

/** Where a client user may still record the interview (feedback after a decision included). */
export const EMPLOYER_INTERVIEW_STAGES = [
  ...EMPLOYER_DECISION_STAGES,
  'rejected',
  'hired',
] as const satisfies readonly ApplicationStatus[];

export const isEmployerDecisionStage = (status: string): boolean =>
  (EMPLOYER_DECISION_STAGES as readonly string[]).includes(status);
export const isEmployerInterviewStage = (status: string): boolean =>
  (EMPLOYER_INTERVIEW_STAGES as readonly string[]).includes(status);

export const applicationStatusSchema = z.enum(MANUAL_APPLICATION_STATUSES, {
  errorMap: () => ({ message: 'Choose a status.' }),
});

export const INTERVIEW_STATUSES = [
  'not_scheduled',
  'scheduled',
  'completed',
  'passed',
  'failed',
  'cancelled',
] as const;
export type InterviewStatus = (typeof INTERVIEW_STATUSES)[number];

/**
 * The employer interview panel. `interviewAt` is a datetime-local value in the
 * business time zone (Cyprus), or blank. A scheduled interview needs a date.
 */
export const interviewSchema = z
  .object({
    interviewStatus: z.enum(INTERVIEW_STATUSES, {
      errorMap: () => ({ message: 'Choose an interview status.' }),
    }),
    interviewAt: z
      .string()
      .trim()
      .optional()
      .transform((v, ctx) => {
        if (!v) return null;
        const date = fromZonedInputValue(v);
        if (!date) {
          ctx.addIssue({ code: z.ZodIssueCode.custom, message: 'Enter a valid date and time.' });
          return z.NEVER;
        }
        return date;
      }),
    interviewNotes: optionalText(10_000),
    employerFeedback: optionalText(10_000),
  })
  .refine((v) => v.interviewStatus !== 'scheduled' || v.interviewAt !== null, {
    message: 'Add the interview date and time.',
    path: ['interviewAt'],
  });
export type InterviewInput = z.input<typeof interviewSchema>;

export const CV_MAX_BYTES = 10 * 1024 * 1024;
export const CV_EXTENSIONS = ['pdf', 'doc', 'docx'] as const;

const requiredText = (label: string, max: number) =>
  z.string().trim().min(1, `${label} is required.`).max(max, `${label} is too long.`);

export const candidateSchema = z.object({
  firstName: requiredText('First name', 120),
  lastName: requiredText('Last name', 120),
  phone: requiredText('Phone', 40).regex(/^[+\d][\d\s().-]{5,}$/, 'Enter a valid phone number.'),
  // Lower-case: one candidate per address (candidates.email is unique).
  email: z.string().trim().toLowerCase().min(1, 'Email is required.').max(255).email('Enter a valid email address.'),
  linkedin: z
    .string()
    .trim()
    .max(2048)
    .refine((v) => v === '' || /^https?:\/\//i.test(v), { message: 'Enter a full URL (https://…).' })
    .optional()
    .transform((v) => (v ? v : null)),
  coverLetter: optionalText(10_000),
  screeningNotes: optionalText(10_000),
  // Optional: blank adds the person to the talent pool without a job.
  jobId: z.preprocess((v) => (v === '' ? undefined : v), relationId('job').optional()),
  // The new application's stage.
  status: applicationStatusSchema.default('pending'),
});

/** Putting a pool candidate forward for a job. Submitting to the employer happens later, with notes. */
export const ASSIGN_STATUSES = ['pending', 'under_review', 'shortlisted'] as const satisfies readonly ManualApplicationStatus[];
export const assignToJobSchema = z.object({
  jobId: relationId('job'),
  status: z.enum(ASSIGN_STATUSES, { errorMap: () => ({ message: 'Choose a status.' }) }).default('pending'),
});

export const candidateScreeningNotesSchema = z.string().trim().max(10_000, 'Screening notes are too long.');

/** The public apply form: the visitor's own details. The job and status are set by the server. */
export const applicationSchema = candidateSchema.pick({
  firstName: true,
  lastName: true,
  phone: true,
  email: true,
  linkedin: true,
  coverLetter: true,
});

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
  // The client a Client (EMPLOYER) user belongs to; cleared for every other role.
  clientId: z.string().trim().optional(),
};

/** A Client user must name its client (they'd see nothing otherwise); other roles never keep one. */
function withClient<T extends { role: Role; clientId?: string }>(value: T, ctx: z.RefinementCtx) {
  if (value.role !== Role.EMPLOYER) return { ...value, clientId: null };
  if (!value.clientId || !z.string().uuid().safeParse(value.clientId).success) {
    ctx.addIssue({ code: z.ZodIssueCode.custom, path: ['clientId'], message: 'Choose the client this user belongs to.' });
    return z.NEVER;
  }
  return { ...value, clientId: value.clientId };
}

export const userCreateSchema = z.object({
  ...userFields,
  password: z
    .string()
    .min(PASSWORD_MIN_LENGTH, `Use at least ${PASSWORD_MIN_LENGTH} characters.`)
    .max(200),
}).transform(withClient);

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
}).transform(withClient);
