import { cache } from 'react';
import { prisma } from '@/lib/prisma';
import { requireAdmin, requireView } from '@/lib/admin/auth';
import { paginate, type ListParams, type Paginated, type SortDir } from '@/lib/admin/list-params';
import type { Prisma } from '@/lib/generated/prisma/client';
import { defaultLocale } from '@/types/locale';

/** SiteSetting is a single-row table; this is that row's id. */
export const SITE_SETTING_ID = 1;

// Ids come from the URL; a malformed one would make Postgres reject the query.
const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export async function getAdminCounts() {
  await requireView('dashboard');
  const [categories, activeCategories, cities, jobs, publishedJobs, candidates] = await Promise.all([
    prisma.jobCategory.count(),
    prisma.jobCategory.count({ where: { isActive: true } }),
    prisma.city.count(),
    prisma.job.count(),
    prisma.job.count({ where: { status: 'published' } }),
    prisma.candidate.count(),
  ]);
  return { categories, activeCategories, cities, jobs, publishedJobs, candidates };
}

const DAY_MS = 24 * 60 * 60 * 1000;

/** UTC calendar day, e.g. "2026-10-08"; the key the activity chart buckets by. */
function dayKey(date: Date): string {
  return date.toISOString().slice(0, 10);
}

export type ActivityDay = { date: string; count: number };

/**
 * Candidate activity for the dashboard: counts per status, applications per
 * day for the last `days` days (oldest first), this week against last week,
 * the newest applications and the jobs with the most applicants. Cached per
 * request, since several dashboard widgets read it.
 */
export const getCandidateInsights = cache(async (days = 14) => {
  await requireView('candidates');
  const now = new Date();
  const todayStart = new Date(`${dayKey(now)}T00:00:00.000Z`);
  const since = new Date(todayStart.getTime() - (days - 1) * DAY_MS);
  const weekAgo = new Date(now.getTime() - 7 * DAY_MS);
  const twoWeeksAgo = new Date(now.getTime() - 14 * DAY_MS);

  const [byStatus, recentDates, thisWeek, lastWeek, latest, topJobs] = await Promise.all([
    prisma.candidate.groupBy({ by: ['status'], _count: { _all: true } }),
    prisma.candidate.findMany({ where: { createdAt: { gte: since } }, select: { createdAt: true } }),
    prisma.candidate.count({ where: { createdAt: { gte: weekAgo } } }),
    prisma.candidate.count({ where: { createdAt: { gte: twoWeeksAgo, lt: weekAgo } } }),
    prisma.candidate.findMany({
      orderBy: [{ createdAt: 'desc' }, { id: 'asc' }],
      take: 5,
      select: {
        id: true,
        firstName: true,
        lastName: true,
        status: true,
        createdAt: true,
        job: { select: { title: true } },
      },
    }),
    prisma.job.findMany({
      where: { candidates: { some: {} } },
      orderBy: [{ candidates: { _count: 'desc' } }, { updatedAt: 'desc' }],
      take: 5,
      select: { id: true, title: true, status: true, _count: { select: { candidates: true } } },
    }),
  ]);

  const perDay = new Map<string, number>();
  for (const { createdAt } of recentDates) {
    const key = dayKey(createdAt);
    perDay.set(key, (perDay.get(key) ?? 0) + 1);
  }
  const activity: ActivityDay[] = Array.from({ length: days }, (_, i) => {
    const date = dayKey(new Date(since.getTime() + i * DAY_MS));
    return { date, count: perDay.get(date) ?? 0 };
  });

  const statusCounts = { pending: 0, success: 0, rejected: 0 } as Record<string, number>;
  for (const row of byStatus) statusCounts[row.status] = row._count._all;

  return { statusCounts, activity, thisWeek, lastWeek, latest, topJobs };
});

/** Jobs per status (draft | published | closed). */
export async function getJobStatusCounts(): Promise<Record<string, number>> {
  await requireView('jobs');
  const rows = await prisma.job.groupBy({ by: ['status'], _count: { _all: true } });
  const counts: Record<string, number> = { published: 0, draft: 0, closed: 0 };
  for (const row of rows) counts[row.status] = row._count._all;
  return counts;
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
  await requireView('categories');
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
  await requireView('categories');
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
  await requireView('categories');
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
  await requireView('cities');
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
  await requireView('cities');
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
  await requireView('jobTypes');
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
  await requireView('jobTypes');
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
  await requireView('jobs');
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
  await requireView('jobs');
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
  await requireView('settings');
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
  await requireView('candidates');
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
  await requireView('candidates');
  return prisma.candidate.findUnique({
    where: { id },
    include: {
      job: { select: { id: true, title: true, city: { select: { name: true } } } },
    },
  });
}

// ─── Users ───────────────────────────────────────────────────────────────────

const userListSelect = {
  id: true,
  email: true,
  name: true,
  role: true,
  createdAt: true,
} satisfies Prisma.UserSelect;

export type UserListRow = Prisma.UserGetPayload<{ select: typeof userListSelect }>;

export const USER_SORT_KEYS = ['email', 'name', 'role', 'createdAt'] as const;
export type UserSortKey = (typeof USER_SORT_KEYS)[number];

const userOrderBy: Record<UserSortKey, (dir: SortDir) => Prisma.UserOrderByWithRelationInput[]> = {
  email: (dir) => [{ email: dir }],
  name: (dir) => [{ name: { sort: dir, nulls: 'last' } }, { email: 'asc' }],
  role: (dir) => [{ role: dir }, { email: 'asc' }],
  createdAt: (dir) => [{ createdAt: dir }],
};

/** One page of users matching `q` by email or name. Default order is by email. */
export async function listUsers(params: ListParams<UserSortKey>): Promise<Paginated<UserListRow>> {
  await requireView('users');
  const { q, sort } = params;
  const where: Prisma.UserWhereInput | undefined = q
    ? {
        OR: [
          { email: { contains: q, mode: 'insensitive' } },
          { name: { contains: q, mode: 'insensitive' } },
        ],
      }
    : undefined;

  const total = await prisma.user.count({ where });
  const { skip, take, ...info } = paginate(params, total);
  const rows = await prisma.user.findMany({
    where,
    orderBy: [...(sort ? userOrderBy[sort.key](sort.dir) : [{ email: 'asc' as const }]), { id: 'asc' }],
    select: userListSelect,
    skip,
    take,
  });
  return { ...info, rows };
}

export async function getUser(id: string) {
  await requireView('users');
  if (!UUID_RE.test(id)) return null;
  return prisma.user.findUnique({ where: { id }, select: userListSelect });
}
