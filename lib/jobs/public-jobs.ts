import 'server-only';
import { cache } from 'react';
import type { Prisma } from '@/lib/generated/prisma/client';
import { prisma } from '@/lib/prisma';
import { sanitizeRichText } from '@/lib/rich-text';
import { isUuid } from '@/lib/utils';
import type { JobStatus } from '@/schemas/AdminSchemas';
import { defaultLocale } from '@/types/locale';
import type { PublicJob, PublicJobSummary } from '@/types/job';

/** Only published jobs are visible on the site; drafts and closed jobs stay in the panel. */
const PUBLIC_STATUS: JobStatus = 'published';

const summarySelect = {
  id: true,
  title: true,
  salary: true,
  experience: true,
  city: { select: { name: true, state: true } },
  jobType: { select: { name: true, slug: true } },
  jobCategory: { 
    select: { 
      imageUrl: true,
      translations: { select: { locale: true, name: true } } 
    } 
  },
} satisfies Prisma.JobSelect;


type SummaryRow = Prisma.JobGetPayload<{ select: typeof summarySelect }>;

/** Category name in `locale`, else the default locale, else any translation. */
function categoryName(translations: { locale: string; name: string }[], locale: string): string {
  return (
    translations.find((t) => t.locale === locale)?.name ??
    translations.find((t) => t.locale === defaultLocale)?.name ??
    translations[0]?.name ??
    ''
  );
}

function toSummary(row: SummaryRow, locale: string): PublicJobSummary {
  return {
    id: row.id,
    title: row.title,
    salary: row.salary,
    experience: row.experience,
    city: row.city.name,
    jobType: row.jobType.name,
    jobTypeSlug: row.jobType.slug,
    category: categoryName(row.jobCategory.translations, locale),
  };
}

/** Published jobs matching `search` (title, city, type or category), newest first. */
export async function listPublishedJobs({
  search,
  locale,
}: {
  search: string;
  locale: string;
}): Promise<PublicJobSummary[]> {
  const contains = { contains: search, mode: 'insensitive' } as const;
  const rows = await prisma.job.findMany({
    where: {
      status: PUBLIC_STATUS,
      ...(search && {
        OR: [
          { title: contains },
          { city: { name: contains } },
          { jobType: { name: contains } },
          { jobCategory: { translations: { some: { name: contains } } } },
        ],
      }),
    },
    orderBy: [{ createdAt: 'desc' }, { id: 'asc' }],
    select: summarySelect,
  });
  return rows.map((row) => toSummary(row, locale));
}

/**
 * One published job, or null if the id is malformed, unknown or not
 * published. Cached per request, so a page and its generateMetadata share one
 * query. Stored HTML is sanitized again here, whatever wrote it.
 */
export const getPublishedJob = cache(async (id: string, locale: string): Promise<PublicJob | null> => {
  if (!isUuid(id)) return null;
  const row = await prisma.job.findFirst({
    where: { id, status: PUBLIC_STATUS },
    select: {
      ...summarySelect,
      description: true,
      responsibilities: true,
      requirements: true,
      benefits: true,
    },
  });
  if (!row) return null;

  return {
    ...toSummary(row, locale),
    location: row.city.state ? `${row.city.name}, ${row.city.state}` : row.city.name,
    description: sanitizeRichText(row.description),
    responsibilities: sanitizeRichText(row.responsibilities),
    requirements: sanitizeRichText(row.requirements),
    benefits: sanitizeRichText(row.benefits),
    // Correctly fetches imageUrl from your model's jobCategory relation definition
    categoryImage: row.jobCategory?.imageUrl ?? null, 
  };
});
