import { prisma } from '@/lib/prisma';
import { requireAdmin } from '@/lib/admin/auth';
import { paginate, type ListParams, type Paginated, type SortDir } from '@/lib/admin/list-params';
import type { Prisma } from '@/lib/generated/prisma/client';
import { defaultLocale } from '@/types/locale';

/** SiteSetting is a single-row table; this is that row's id. */
export const SITE_SETTING_ID = 1;

// Ids come from the URL; a malformed one would make Postgres reject the query.
const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export async function getAdminCounts() {
  await requireAdmin();
  const [categories, activeCategories, cities, jobs, publishedJobs] = await Promise.all([
    prisma.jobCategory.count(),
    prisma.jobCategory.count({ where: { isActive: true } }),
    prisma.city.count(),
    prisma.job.count(),
    prisma.job.count({ where: { status: 'published' } }),
  ]);
  return { categories, activeCategories, cities, jobs, publishedJobs };
}

export type RecentChange = {
  id: string;
  kind: 'category' | 'city';
  name: string;
  href: string;
  updatedAt: Date;
};

/** Most recently edited categories and cities, newest first. */
export async function listRecentChanges(limit = 6): Promise<RecentChange[]> {
  await requireAdmin();
  const [categories, cities] = await Promise.all([
    prisma.jobCategory.findMany({
      orderBy: { updatedAt: 'desc' },
      take: limit,
      include: { translations: true },
    }),
    prisma.city.findMany({ orderBy: { updatedAt: 'desc' }, take: limit }),
  ]);

  return [
    ...categories.map((c) => ({
      id: c.id,
      kind: 'category' as const,
      name: categoryDisplayName(c),
      href: `/admin/categories/${c.id}/edit`,
      updatedAt: c.updatedAt,
    })),
    ...cities.map((c) => ({
      id: c.id,
      kind: 'city' as const,
      name: c.name,
      href: `/admin/cities/${c.id}/edit`,
      updatedAt: c.updatedAt,
    })),
  ]
    .sort((a, b) => b.updatedAt.getTime() - a.updatedAt.getTime())
    .slice(0, limit);
}

/** Name in the default locale, else any translation. */
export function categoryDisplayName(category: {
  translations: { locale: string; name: string }[];
}): string {
  return (
    category.translations.find((t) => t.locale === defaultLocale)?.name ??
    category.translations[0]?.name ??
    '(untitled)'
  );
}

const categoryListInclude = {
  translations: true,
  _count: { select: { jobs: true } },
} satisfies Prisma.JobCategoryInclude;

type CategoryWithTranslations = Prisma.JobCategoryGetPayload<{ include: typeof categoryListInclude }>;

export const CATEGORY_SORT_KEYS = ['name', 'slug', 'sortOrder', 'status'] as const;
export type CategorySortKey = (typeof CATEGORY_SORT_KEYS)[number];

const categoryOrderBy: Record<
  Exclude<CategorySortKey, 'name'>,
  (dir: SortDir) => Prisma.JobCategoryOrderByWithRelationInput[]
> = {
  slug: (dir) => [{ slug: dir }],
  sortOrder: (dir) => [{ sortOrder: dir }, { createdAt: 'asc' }],
  // asc = visible first.
  status: (dir) => [{ isActive: dir === 'asc' ? 'desc' : 'asc' }, { sortOrder: 'asc' }],
};

const nameCollator = new Intl.Collator(defaultLocale, { sensitivity: 'base', numeric: true });

/**
 * One page of categories matching `q` (slug or any translated name). Default
 * order is the public site's: sortOrder, then creation time.
 */
export async function listCategories(
  params: ListParams<CategorySortKey>
): Promise<Paginated<CategoryWithTranslations>> {
  await requireAdmin();
  const { q, sort } = params;
  const where: Prisma.JobCategoryWhereInput | undefined = q
    ? {
        OR: [
          { slug: { contains: q, mode: 'insensitive' } },
          { translations: { some: { name: { contains: q, mode: 'insensitive' } } } },
        ],
      }
    : undefined;

  // Prisma can't order by one locale's row of a to-many relation, so name
  // sorting loads the matches, sorts and slices here. Fine at category-list
  // scale (tens of rows); every other order pages in the database.
  if (sort?.key === 'name') {
    const all = await prisma.jobCategory.findMany({ where, include: categoryListInclude });
    const sign = sort.dir === 'asc' ? 1 : -1;
    all.sort((a, b) => sign * nameCollator.compare(categoryDisplayName(a), categoryDisplayName(b)));
    const { skip, take, ...info } = paginate(params, all.length);
    return { ...info, rows: all.slice(skip, skip + take) };
  }

  const total = await prisma.jobCategory.count({ where });
  const { skip, take, ...info } = paginate(params, total);
  const rows = await prisma.jobCategory.findMany({
    where,
    orderBy: [
      ...(sort ? categoryOrderBy[sort.key](sort.dir) : [{ sortOrder: 'asc' as const }, { createdAt: 'asc' as const }]),
      // Stable tie-break, so rows don't hop between pages across requests.
      { id: 'asc' },
    ],
    include: categoryListInclude,
    skip,
    take,
  });
  return { ...info, rows };
}

export async function getCategory(id: string) {
  await requireAdmin();
  if (!UUID_RE.test(id)) return null;
  return prisma.jobCategory.findUnique({
    where: { id },
    include: { translations: true },
  });
}

export const CITY_SORT_KEYS = ['name', 'slug', 'state', 'updatedAt'] as const;
export type CitySortKey = (typeof CITY_SORT_KEYS)[number];

const cityOrderBy: Record<CitySortKey, (dir: SortDir) => Prisma.CityOrderByWithRelationInput[]> = {
  name: (dir) => [{ name: dir }],
  slug: (dir) => [{ slug: dir }],
  // Cities without a region go last in both directions.
  state: (dir) => [{ state: { sort: dir, nulls: 'last' } }, { name: 'asc' }],
  updatedAt: (dir) => [{ updatedAt: dir }],
};

/** One page of cities matching `q` by name or region. Default order is by name. */
export type CityWithCount = Prisma.CityGetPayload<{
  include: { _count: { select: { jobs: true } } };
}>;

export async function listCities(params: ListParams<CitySortKey>): Promise<Paginated<CityWithCount>> {
  await requireAdmin();
  const { q, sort } = params;
  const where: Prisma.CityWhereInput | undefined = q
    ? {
        OR: [
          { name: { contains: q, mode: 'insensitive' } },
          { state: { contains: q, mode: 'insensitive' } },
        ],
      }
    : undefined;

  const total = await prisma.city.count({ where });
  const { skip, take, ...info } = paginate(params, total);
  const rows = await prisma.city.findMany({
    where,
    // `id` last keeps ties in a stable order, so rows don't hop between pages.
    orderBy: [...(sort ? cityOrderBy[sort.key](sort.dir) : [{ name: 'asc' as const }]), { id: 'asc' }],
    include: { _count: { select: { jobs: true } } },
    skip,
    take,
  });
  return { ...info, rows };
}

export async function getCity(id: string) {
  await requireAdmin();
  if (!UUID_RE.test(id)) return null;
  return prisma.city.findUnique({ where: { id } });
}

export type JobTypeWithCount = Prisma.JobTypeGetPayload<{
  include: { _count: { select: { jobs: true } } };
}>;

export const JOB_TYPE_SORT_KEYS = ['name', 'slug', 'jobs', 'updatedAt'] as const;
export type JobTypeSortKey = (typeof JOB_TYPE_SORT_KEYS)[number];

const jobTypeOrderBy: Record<
  JobTypeSortKey,
  (dir: SortDir) => Prisma.JobTypeOrderByWithRelationInput[]
> = {
  name: (dir) => [{ name: dir }],
  slug: (dir) => [{ slug: dir }],
  jobs: (dir) => [{ jobs: { _count: dir } }, { name: 'asc' }],
  updatedAt: (dir) => [{ updatedAt: dir }],
};

/** One page of job types matching `q` by name or slug. Default order is by name. */
export async function listJobTypes(
  params: ListParams<JobTypeSortKey>
): Promise<Paginated<JobTypeWithCount>> {
  await requireAdmin();
  const { q, sort } = params;
  const where: Prisma.JobTypeWhereInput | undefined = q
    ? {
        OR: [
          { name: { contains: q, mode: 'insensitive' } },
          { slug: { contains: q, mode: 'insensitive' } },
        ],
      }
    : undefined;

  const total = await prisma.jobType.count({ where });
  const { skip, take, ...info } = paginate(params, total);
  const rows = await prisma.jobType.findMany({
    where,
    orderBy: [...(sort ? jobTypeOrderBy[sort.key](sort.dir) : [{ name: 'asc' as const }]), { id: 'asc' }],
    include: { _count: { select: { jobs: true } } },
    skip,
    take,
  });
  return { ...info, rows };
}

export async function getJobType(id: string) {
  await requireAdmin();
  if (!UUID_RE.test(id)) return null;
  return prisma.jobType.findUnique({ where: { id } });
}

const jobListInclude = {
  city: { select: { name: true } },
  jobType: { select: { name: true } },
  _count: { select: { candidates: true } },
} satisfies Prisma.JobInclude;

export type JobListRow = Prisma.JobGetPayload<{ include: typeof jobListInclude }>;

export const JOB_SORT_KEYS = ['title', 'city', 'type', 'status', 'updatedAt'] as const;
export type JobSortKey = (typeof JOB_SORT_KEYS)[number];

const jobOrderBy: Record<JobSortKey, (dir: SortDir) => Prisma.JobOrderByWithRelationInput[]> = {
  title: (dir) => [{ title: dir }],
  city: (dir) => [{ city: { name: dir } }, { title: 'asc' }],
  type: (dir) => [{ jobType: { name: dir } }, { title: 'asc' }],
  status: (dir) => [{ status: dir }, { updatedAt: 'desc' }],
  updatedAt: (dir) => [{ updatedAt: dir }],
};

/** One page of jobs matching `q` by title, city or type. Default order is newest edit first. */
export async function listJobs(params: ListParams<JobSortKey>): Promise<Paginated<JobListRow>> {
  await requireAdmin();
  const { q, sort } = params;
  const where: Prisma.JobWhereInput | undefined = q
    ? {
        OR: [
          { title: { contains: q, mode: 'insensitive' } },
          { city: { name: { contains: q, mode: 'insensitive' } } },
          { jobType: { name: { contains: q, mode: 'insensitive' } } },
        ],
      }
    : undefined;

  const total = await prisma.job.count({ where });
  const { skip, take, ...info } = paginate(params, total);
  const rows = await prisma.job.findMany({
    where,
    orderBy: [
      ...(sort ? jobOrderBy[sort.key](sort.dir) : [{ updatedAt: 'desc' as const }]),
      { id: 'asc' },
    ],
    include: jobListInclude,
    skip,
    take,
  });
  return { ...info, rows };
}

export async function getJob(id: string) {
  await requireAdmin();
  if (!UUID_RE.test(id)) return null;
  return prisma.job.findUnique({ where: { id } });
}

export type SelectOption = { value: string; label: string };

/**
 * Choices for the job form's selects. Only active categories are offered,
 * plus `currentCategoryId` when editing a job whose category was since hidden,
 * so saving doesn't silently change it.
 */
export async function getJobFormOptions(currentCategoryId?: string) {
  await requireAdmin();
  const [cities, jobTypes, categories] = await Promise.all([
    prisma.city.findMany({ orderBy: { name: 'asc' }, select: { id: true, name: true, state: true } }),
    prisma.jobType.findMany({ orderBy: { name: 'asc' }, select: { id: true, name: true } }),
    prisma.jobCategory.findMany({
      where: currentCategoryId
        ? { OR: [{ isActive: true }, { id: currentCategoryId }] }
        : { isActive: true },
      orderBy: [{ sortOrder: 'asc' }, { createdAt: 'asc' }],
      include: { translations: true },
    }),
  ]);

  return {
    cities: cities.map((c): SelectOption => ({
      value: c.id,
      label: c.state ? `${c.name}, ${c.state}` : c.name,
    })),
    jobTypes: jobTypes.map((t): SelectOption => ({ value: t.id, label: t.name })),
    categories: categories.map((c): SelectOption => ({
      value: c.id,
      label: c.isActive ? categoryDisplayName(c) : `${categoryDisplayName(c)} (hidden)`,
    })),
  };
}

export async function getSiteSettings() {
  await requireAdmin();
  return prisma.siteSetting.findUnique({ where: { id: SITE_SETTING_ID } });
}

// ─── Candidates ──────────────────────────────────────────────────────────────

const candidateListInclude = {
  job: { select: { id: true, title: true } },
} satisfies Prisma.CandidateInclude;

export type CandidateListRow = Prisma.CandidateGetPayload<{ include: typeof candidateListInclude }>;

export const CANDIDATE_SORT_KEYS = ['name', 'job', 'status', 'createdAt'] as const;
export type CandidateSortKey = (typeof CANDIDATE_SORT_KEYS)[number];

const candidateOrderBy: Record<
  CandidateSortKey,
  (dir: SortDir) => Prisma.CandidateOrderByWithRelationInput[]
> = {
  name: (dir) => [{ lastName: dir }, { firstName: dir }],
  job: (dir) => [{ job: { title: dir } }, { createdAt: 'desc' }],
  status: (dir) => [{ status: dir }, { createdAt: 'desc' }],
  createdAt: (dir) => [{ createdAt: dir }],
};

/** One page of candidates matching `q` by name, email or job title. Default order is newest first. */
export async function listCandidates(
  params: ListParams<CandidateSortKey>,
  jobId?: string
): Promise<Paginated<CandidateListRow>> {
  await requireAdmin();
  const { q, sort } = params;
  const where: Prisma.CandidateWhereInput = {
    ...(jobId ? { jobId } : {}),
    ...(q
      ? {
          OR: [
            { firstName: { contains: q, mode: 'insensitive' } },
            { lastName: { contains: q, mode: 'insensitive' } },
            { email: { contains: q, mode: 'insensitive' } },
            { job: { title: { contains: q, mode: 'insensitive' } } },
          ],
        }
      : {}),
  };

  const total = await prisma.candidate.count({ where });
  const { skip, take, ...info } = paginate(params, total);
  const rows = await prisma.candidate.findMany({
    where,
    orderBy: [
      ...(sort ? candidateOrderBy[sort.key](sort.dir) : [{ createdAt: 'desc' as const }]),
      { id: 'asc' },
    ],
    include: candidateListInclude,
    skip,
    take,
  });
  return { ...info, rows };
}

/** Jobs a candidate can be attached to, newest first. */
export async function getCandidateJobOptions(): Promise<SelectOption[]> {
  await requireAdmin();
  const jobs = await prisma.job.findMany({
    orderBy: { createdAt: 'desc' },
    select: { id: true, title: true, status: true },
  });
  return jobs.map((j) => ({
    value: j.id,
    label: j.status === 'published' ? j.title : `${j.title} (${j.status})`,
  }));
}

export async function getCandidate(id: string) {
  await requireAdmin();
  return prisma.candidate.findUnique({
    where: { id },
    include: {
      job: { select: { id: true, title: true, city: { select: { name: true } } } },
    },
  });
}
