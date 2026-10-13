import 'server-only';
import { cache } from 'react';
import type { Prisma } from '@/lib/generated/prisma/client';
import { fetchPage, type Paginated } from '@/lib/admin/list-params';
import { JOBS_PAGE_SIZE, type JobsListParams } from '@/lib/jobs/jobs-params';
import { prisma } from '@/lib/prisma';
import { sanitizeRichText } from '@/lib/rich-text';
import { isUuid } from '@/lib/utils';
import type { JobStatus } from '@/schemas/AdminSchemas';
import { defaultLocale } from '@/types/locale';
import type {
  CategoryOption,
  CityOption,
  JobTypeOption,
  PublicJob,
  PublicJobSummary,
} from '@/types/job';

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

// Served by the (status, createdAt) index in schema.prisma; id breaks ties so
// rows never shift between pages.
const publicOrderBy = [
  { createdAt: 'desc' },
  { id: 'asc' },
] satisfies Prisma.JobOrderByWithRelationInput[];

/**
 * Published jobs narrowed by the list filters. Text matching is
 * case-insensitive (ILIKE); the search looks at title, city, type and category.
 */
function publicJobsWhere({
  search,
  location,
  type,
  category,
  campaign,
}: Pick<JobsListParams, 'search' | 'location' | 'type' | 'category' | 'campaign'>): Prisma.JobWhereInput {
  const contains = { contains: search, mode: 'insensitive' } as const;
  return {
    status: PUBLIC_STATUS,
    ...(location && { city: { slug: location } }),
    ...(type && { jobType: { slug: type } }),
    ...(category && { jobCategory: { slug: category } }),
    ...(campaign && { campaignId: campaign }),
    ...(search && {
      OR: [
        { title: contains },
        { city: { name: contains } },
        { jobType: { name: contains } },
        { jobCategory: { translations: { some: { name: contains } } } },
      ],
    }),
  };
}

/** One page of published jobs, newest first; the page's rows and its total are fetched concurrently. */
export async function listPublishedJobsPage(
  params: JobsListParams,
  locale: string,
  pageSize: number = JOBS_PAGE_SIZE
): Promise<Paginated<PublicJobSummary>> {
  const where = publicJobsWhere(params);
  const { rows, ...info } = await fetchPage(
    { page: params.page, pageSize },
    () => prisma.job.count({ where }),
    ({ skip, take }) =>
      prisma.job.findMany({ where, orderBy: publicOrderBy, select: summarySelect, skip, take })
  );
  return { ...info, rows: rows.map((row) => toSummary(row, locale)) };
}

/**
 * Cities with at least one published job, A–Z, for the location filter. Each
 * count applies the other active filters (search, type, category, campaign) but not the
 * location itself, so a chip says how many roles picking it would show.
 */
export async function listPublicCities(
  params: Pick<JobsListParams, 'search' | 'type' | 'category' | 'campaign'>
): Promise<CityOption[]> {
  const cities = await prisma.city.findMany({
    where: { jobs: { some: { status: PUBLIC_STATUS } } },
    select: {
      name: true,
      slug: true,
      _count: { select: { jobs: { where: publicJobsWhere({ ...params, location: '' }) } } },
    },
    orderBy: { name: 'asc' },
  });
  return cities.map(({ name, slug, _count }) => ({ name, slug, count: _count.jobs }));
}

/** Job types with at least one published job, A–Z, for the type filter. */
export async function listPublicJobTypes(): Promise<JobTypeOption[]> {
  return prisma.jobType.findMany({
    where: { jobs: { some: { status: PUBLIC_STATUS } } },
    select: { name: true, slug: true },
    orderBy: { name: 'asc' },
  });
}

/**
 * Active categories with at least one published job, in the admin's order,
 * for the home page's category grid and the /jobs category filter. Names are
 * in `locale`; counts are all published jobs in the category.
 */
export async function listPublicCategories(locale: string): Promise<CategoryOption[]> {
  const published = { status: PUBLIC_STATUS } satisfies Prisma.JobWhereInput;
  const categories = await prisma.jobCategory.findMany({
    where: { isActive: true, jobs: { some: published } },
    select: {
      slug: true,
      imageUrl: true,
      icon: true,
      translations: { select: { locale: true, name: true } },
      _count: { select: { jobs: { where: published } } },
    },
    orderBy: [{ sortOrder: 'asc' }, { createdAt: 'asc' }],
  });
  return categories.map(({ slug, imageUrl, icon, translations, _count }) => ({
    name: categoryName(translations, locale),
    slug,
    imageUrl,
    icon,
    count: _count.jobs,
  }));
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
