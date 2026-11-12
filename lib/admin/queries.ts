import 'server-only';
import { cache } from 'react';
import { prisma } from '@/lib/prisma';
import { requireAdmin, requireView } from '@/lib/admin/auth';
import { fetchPage, paginate, type ListParams, type Paginated, type SortDir } from '@/lib/admin/list-params';
import type { Faq, Prisma } from '@/lib/generated/prisma/client';
import { SITE_SETTING_ID } from '@/lib/site-settings';
import { isUuid } from '@/lib/utils';
import { defaultLocale } from '@/types/locale';
import { APPLICATION_STATUSES, type ApplicationStatus, type CandidateStatus } from '@/schemas/AdminSchemas';
import { applicationScope, isClientUser, jobScope, scoped } from '@/lib/admin/scope';
import { canEdit } from '@/lib/auth/roles';

export async function getAdminCounts() {
  const user = await requireView('dashboard');
  const jobs$ = jobScope(user);
  const [categories, activeCategories, cities, jobs, publishedJobs, candidates] = await Promise.all([
    prisma.jobCategory.count(),
    prisma.jobCategory.count({ where: { isActive: true } }),
    prisma.city.count(),
    prisma.job.count({ where: jobs$ }),
    prisma.job.count({ where: scoped(jobs$, { status: 'published' }) }),
    // Applications, the same rows the Candidates list shows (a client: only those submitted to it).
    prisma.jobApplication.count({ where: applicationScope(user) }),
  ]);
  return { categories, activeCategories, cities, jobs, publishedJobs, candidates };
}

const DAY_MS = 24 * 60 * 60 * 1000;

/** UTC calendar day, e.g. "2026-10-08"; the key the activity chart buckets by. */
function dayKey(date: Date): string {
  return date.toISOString().slice(0, 10);
}

/** Subtract calendar months while keeping the day within the target month. */
function monthsAgo(date: Date, months: number): Date {
  const result = new Date(date);
  const day = result.getUTCDate();
  result.setUTCDate(1);
  result.setUTCMonth(result.getUTCMonth() - months);
  const lastDay = new Date(Date.UTC(result.getUTCFullYear(), result.getUTCMonth() + 1, 0)).getUTCDate();
  result.setUTCDate(Math.min(day, lastDay));
  return result;
}

export type ActivityDay = { date: string; count: number };

/**
 * Candidate activity for the dashboard: counts per status, applications per
 * day for the last `days` days (oldest first), this week against last week,
 * the newest applications and the jobs with the most applicants. Cached per
 * request, since several dashboard widgets read it.
 */
const isApplicationStatus = (status: string): status is ApplicationStatus =>
  (APPLICATION_STATUSES as readonly string[]).includes(status);

const emptyStatusCounts = () =>
  Object.fromEntries(APPLICATION_STATUSES.map((status) => [status, 0])) as Record<ApplicationStatus, number>;

export const getCandidateInsights = cache(async (days = 14) => {
  const user = await requireView('candidates');
  const scope = applicationScope(user);
  const now = new Date();
  const todayStart = new Date(`${dayKey(now)}T00:00:00.000Z`);
  const since = new Date(todayStart.getTime() - (days - 1) * DAY_MS);
  const weekAgo = new Date(now.getTime() - 7 * DAY_MS);
  const twoWeeksAgo = new Date(now.getTime() - 14 * DAY_MS);
  const monthAgo = new Date(now.getTime() - 30 * DAY_MS);
  const threeMonthsAgo = monthsAgo(now, 3);
  const sixMonthsAgo = monthsAgo(now, 6);
  const yearAgo = monthsAgo(now, 12);

  const [
    byStatus,
    recentDates,
    thisWeek,
    lastWeek,
    todayCount,
    last30DaysCount,
    last3MonthsCount,
    last6MonthsCount,
    lastYearCount,
    latest,
    topJobs,
  ] = await Promise.all([
    prisma.jobApplication.groupBy({ by: ['status'], where: scope, _count: { _all: true } }),
    prisma.jobApplication.findMany({ where: scoped(scope, { createdAt: { gte: since } }), select: { createdAt: true } }),
    prisma.jobApplication.count({ where: scoped(scope, { createdAt: { gte: weekAgo } }) }),
    prisma.jobApplication.count({ where: scoped(scope, { createdAt: { gte: twoWeeksAgo, lt: weekAgo } }) }),
    prisma.jobApplication.count({ where: scoped(scope, { createdAt: { gte: todayStart } }) }),
    prisma.jobApplication.count({ where: scoped(scope, { createdAt: { gte: monthAgo } }) }),
    prisma.jobApplication.count({ where: scoped(scope, { createdAt: { gte: threeMonthsAgo } }) }),
    prisma.jobApplication.count({ where: scoped(scope, { createdAt: { gte: sixMonthsAgo } }) }),
    prisma.jobApplication.count({ where: scoped(scope, { createdAt: { gte: yearAgo } }) }),
    prisma.jobApplication.findMany({
      where: scope,
      orderBy: [{ createdAt: 'desc' }, { id: 'asc' }],
      take: 5,
      select: {
        id: true,
        status: true,
        candidate: { select: { firstName: true, lastName: true } },
        createdAt: true,
        job: { select: { title: true } },
      },
    }),
    prisma.job.findMany({
      where: scoped(jobScope(user), { applications: { some: scope } }),
      orderBy: [{ applications: { _count: 'desc' } }, { updatedAt: 'desc' }],
      take: 5,
      select: { id: true, title: true, status: true, _count: { select: { applications: { where: scope } } } },
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

  const statusCounts = emptyStatusCounts();
  for (const row of byStatus) {
    if (isApplicationStatus(row.status)) statusCounts[row.status] = row._count._all;
  }

  const periodCounts = {
    today: todayCount,
    last7Days: thisWeek,
    last30Days: last30DaysCount,
    last3Months: last3MonthsCount,
    last6Months: last6MonthsCount,
    lastYear: lastYearCount,
  };

  return { statusCounts, activity, thisWeek, lastWeek, periodCounts, latest, topJobs };
});

/** Jobs per status (draft | published | closed). */
export async function getJobStatusCounts(): Promise<Record<string, number>> {
  const user = await requireView('jobs');
  const rows = await prisma.job.groupBy({ by: ['status'], where: jobScope(user), _count: { _all: true } });
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

  const orderBy: Prisma.JobCategoryOrderByWithRelationInput[] = [
    ...(sort ? categoryOrderBy[sort.key](sort.dir) : [{ sortOrder: 'asc' as const }, { createdAt: 'asc' as const }]),
    // Stable tie-break, so rows don't hop between pages across requests.
    { id: 'asc' },
  ];
  return fetchPage(
    params,
    () => prisma.jobCategory.count({ where }),
    ({ skip, take }) =>
      prisma.jobCategory.findMany({
        where,
        orderBy,
        include: categoryListInclude,
        skip,
        take,
      })
  );
}

export async function getCategory(id: string) {
  await requireView('categories');
  if (!isUuid(id)) return null;
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

export type CityWithCount = Prisma.CityGetPayload<{
  include: { _count: { select: { jobs: true } } };
}>;

/** One page of cities matching `q` by name or region. Default order is by name. */
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

  return fetchPage(
    params,
    () => prisma.city.count({ where }),
    ({ skip, take }) =>
      prisma.city.findMany({
        where,
        // `id` last keeps ties in a stable order, so rows don't hop between pages.
        orderBy: [...(sort ? cityOrderBy[sort.key](sort.dir) : [{ name: 'asc' as const }]), { id: 'asc' }],
        include: { _count: { select: { jobs: true } } },
        skip,
        take,
      })
  );
}

export async function getCity(id: string) {
  await requireView('cities');
  if (!isUuid(id)) return null;
  return prisma.city.findUnique({ where: { id } });
}

export type ClientWithCount = Prisma.ClientGetPayload<{ include: { _count: { select: { jobs: true } } } }>;
export const CLIENT_SORT_KEYS = ['name', 'contactName', 'email', 'phone', 'jobs', 'updatedAt'] as const;
export type ClientSortKey = (typeof CLIENT_SORT_KEYS)[number];
const clientOrderBy: Record<ClientSortKey, (dir: SortDir) => Prisma.ClientOrderByWithRelationInput[]> = {
  name: (dir) => [{ name: dir }],
  contactName: (dir) => [{ contactName: { sort: dir, nulls: 'last' } }, { name: 'asc' }],
  email: (dir) => [{ email: { sort: dir, nulls: 'last' } }, { name: 'asc' }],
  phone: (dir) => [{ phone: { sort: dir, nulls: 'last' } }, { name: 'asc' }],
  jobs: (dir) => [{ jobs: { _count: dir } }, { name: 'asc' }],
  updatedAt: (dir) => [{ updatedAt: dir }],
};
export async function listClients(params: ListParams<ClientSortKey>): Promise<Paginated<ClientWithCount>> {
  await requireView('clients');
  const { q, sort } = params;
  const where: Prisma.ClientWhereInput | undefined = q ? { OR: [
    { name: { contains: q, mode: 'insensitive' } },
    { contactName: { contains: q, mode: 'insensitive' } },
    { email: { contains: q, mode: 'insensitive' } },
    { phone: { contains: q, mode: 'insensitive' } },
  ] } : undefined;
  return fetchPage(params, () => prisma.client.count({ where }), ({ skip, take }) => prisma.client.findMany({
    where,
    orderBy: [...(sort ? clientOrderBy[sort.key](sort.dir) : [{ name: 'asc' as const }]), { id: 'asc' }],
    include: { _count: { select: { jobs: true } } }, skip, take,
  }));
}
export async function getClient(id: string) {
  await requireView('clients');
  if (!isUuid(id)) return null;
  return prisma.client.findUnique({ where: { id } });
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

  return fetchPage(
    params,
    () => prisma.jobType.count({ where }),
    ({ skip, take }) =>
      prisma.jobType.findMany({
        where,
        orderBy: [...(sort ? jobTypeOrderBy[sort.key](sort.dir) : [{ name: 'asc' as const }]), { id: 'asc' }],
        include: { _count: { select: { jobs: true } } },
        skip,
        take,
      })
  );
}

export async function getJobType(id: string) {
  await requireView('jobTypes');
  if (!isUuid(id)) return null;
  return prisma.jobType.findUnique({ where: { id }, include: { translations: true } });
}

// ─── FAQs ────────────────────────────────────────────────────────────────────

export type FaqRow = Faq;

export const FAQ_SORT_KEYS = ['question', 'sortOrder', 'status', 'updatedAt'] as const;
export type FaqSortKey = (typeof FAQ_SORT_KEYS)[number];

const faqOrderBy: Record<FaqSortKey, (dir: SortDir) => Prisma.FaqOrderByWithRelationInput[]> = {
  question: (dir) => [{ question: dir }],
  sortOrder: (dir) => [{ sortOrder: dir }, { createdAt: 'asc' }],
  // asc = visible first.
  status: (dir) => [{ isActive: dir === 'asc' ? 'desc' : 'asc' }, { sortOrder: 'asc' }],
  updatedAt: (dir) => [{ updatedAt: dir }],
};

/**
 * One page of FAQs matching `q` by question or answer. Default order is the
 * public site's: sortOrder, then creation time.
 */
export async function listFaqs(params: ListParams<FaqSortKey>): Promise<Paginated<FaqRow>> {
  await requireView('faqs');
  const { q, sort } = params;
  const where: Prisma.FaqWhereInput | undefined = q
    ? {
        OR: [
          { question: { contains: q, mode: 'insensitive' } },
          { answer: { contains: q, mode: 'insensitive' } },
        ],
      }
    : undefined;

  return fetchPage(
    params,
    () => prisma.faq.count({ where }),
    ({ skip, take }) =>
      prisma.faq.findMany({
        where,
        orderBy: [
          ...(sort ? faqOrderBy[sort.key](sort.dir) : [{ sortOrder: 'asc' as const }, { createdAt: 'asc' as const }]),
          { id: 'asc' },
        ],
        skip,
        take,
      })
  );
}

export async function getFaq(id: string) {
  await requireView('faqs');
  if (!isUuid(id)) return null;
  return prisma.faq.findUnique({ where: { id }, include: { translations: true } });
}

// ─── Campaigns ───────────────────────────────────────────────────────────────

export type CampaignWithCount = Prisma.CampaignGetPayload<{
  include: { _count: { select: { jobs: true } } };
}>;

export const CAMPAIGN_SORT_KEYS = ['title', 'jobs', 'updatedAt'] as const;
export type CampaignSortKey = (typeof CAMPAIGN_SORT_KEYS)[number];

const campaignOrderBy: Record<
  CampaignSortKey,
  (dir: SortDir) => Prisma.CampaignOrderByWithRelationInput[]
> = {
  title: (dir) => [{ title: dir }],
  jobs: (dir) => [{ jobs: { _count: dir } }, { title: 'asc' }],
  updatedAt: (dir) => [{ updatedAt: dir }],
};

/** One page of campaigns matching `q` by title or intro. Default order is newest edit first. */
export async function listCampaigns(
  params: ListParams<CampaignSortKey>
): Promise<Paginated<CampaignWithCount>> {
  await requireView('campaigns');
  const { q, sort } = params;
  const where: Prisma.CampaignWhereInput | undefined = q
    ? {
        OR: [
          { title: { contains: q, mode: 'insensitive' } },
          { intro: { contains: q, mode: 'insensitive' } },
        ],
      }
    : undefined;

  return fetchPage(
    params,
    () => prisma.campaign.count({ where }),
    ({ skip, take }) =>
      prisma.campaign.findMany({
        where,
        orderBy: [
          ...(sort ? campaignOrderBy[sort.key](sort.dir) : [{ updatedAt: 'desc' as const }]),
          { id: 'asc' },
        ],
        include: { _count: { select: { jobs: true } } },
        skip,
        take,
      })
  );
}

/** A campaign with every assigned job (any status), for the edit page. */
export async function getCampaign(id: string) {
  await requireView('campaigns');
  if (!isUuid(id)) return null;
  return prisma.campaign.findUnique({
    where: { id },
    include: {
      jobs: {
        orderBy: [{ updatedAt: 'desc' }, { id: 'asc' }],
        select: { id: true, title: true, status: true },
      },
      translations: true,
    },
  });
}

// ─── Jobs ────────────────────────────────────────────────────────────────────

const jobListInclude = {
  client: { select: { name: true } },
  city: { select: { name: true } },
  jobType: { select: { name: true } },
  _count: { select: { applications: true } },
} satisfies Prisma.JobInclude;

export type JobListRow = Prisma.JobGetPayload<{ include: typeof jobListInclude }> & {
  candidateStatusCounts: Record<ApplicationStatus, number>;
};

export const JOB_SORT_KEYS = ['title', 'client', 'city', 'type', 'status', 'updatedAt'] as const;
export type JobSortKey = (typeof JOB_SORT_KEYS)[number];

const jobOrderBy: Record<JobSortKey, (dir: SortDir) => Prisma.JobOrderByWithRelationInput[]> = {
  title: (dir) => [{ title: dir }],
  client: (dir) => [{ client: { name: dir } }, { title: 'asc' }],
  city: (dir) => [{ city: { name: dir } }, { title: 'asc' }],
  type: (dir) => [{ jobType: { name: dir } }, { title: 'asc' }],
  status: (dir) => [{ status: dir }, { updatedAt: 'desc' }],
  updatedAt: (dir) => [{ updatedAt: dir }],
};

/** One page of jobs matching `q` by title, city or type. Default order is newest edit first. */
export async function listJobs(params: ListParams<JobSortKey>): Promise<Paginated<JobListRow>> {
  const user = await requireView('jobs');
  const { q, sort } = params;
  const where: Prisma.JobWhereInput = scoped<Prisma.JobWhereInput>(jobScope(user), {
    ...(q && {
        OR: [
          { title: { contains: q, mode: 'insensitive' } },
          { client: { name: { contains: q, mode: 'insensitive' } } },
          { city: { name: { contains: q, mode: 'insensitive' } } },
          { jobType: { name: { contains: q, mode: 'insensitive' } } },
        ],
      }),
  });

  const page = await fetchPage(
    params,
    () => prisma.job.count({ where }),
    ({ skip, take }) =>
      prisma.job.findMany({
        where,
        orderBy: [
          ...(sort ? jobOrderBy[sort.key](sort.dir) : [{ updatedAt: 'desc' as const }]),
          { id: 'asc' },
        ],
        include: {
          ...jobListInclude,
          _count: { select: { applications: { where: applicationScope(user) } } },
        },
        skip,
        take,
      })
  );

  const rows = page.rows;
  const counts = rows.length
    ? await prisma.jobApplication.groupBy({
        by: ['jobId', 'status'],
        where: scoped(applicationScope(user), { jobId: { in: rows.map((job) => job.id) } }),
        _count: { _all: true },
      })
    : [];
  const countsByJob = new Map<string, Record<ApplicationStatus, number>>();
  for (const job of rows) countsByJob.set(job.id, emptyStatusCounts());
  for (const row of counts) {
    const jobCounts = countsByJob.get(row.jobId);
    if (jobCounts && isApplicationStatus(row.status)) jobCounts[row.status] = row._count._all;
  }

  return {
    ...page,
    rows: rows.map((job) => ({
      ...job,
      candidateStatusCounts: countsByJob.get(job.id)!,
    })),
  };
}

export async function getJob(id: string) {
  const user = await requireView('jobs');
  if (!isUuid(id)) return null;
  return prisma.job.findFirst({ where: scoped(jobScope(user), { id }), include: { translations: true } });
}

export type SelectOption = { value: string; label: string };

/**
 * Choices for the job form's selects. Only active categories are offered,
 * plus `currentCategoryId` when editing a job whose category was since hidden,
 * so saving doesn't silently change it.
 */
export async function getJobFormOptions(currentCategoryId?: string) {
  await requireAdmin();
  const [cities, jobTypes, campaigns, categories, clients] = await Promise.all([
    prisma.city.findMany({ orderBy: { name: 'asc' }, select: { id: true, name: true, state: true } }),
    prisma.jobType.findMany({ orderBy: { name: 'asc' }, select: { id: true, name: true } }),
    prisma.campaign.findMany({ orderBy: { title: 'asc' }, select: { id: true, title: true } }),
    prisma.jobCategory.findMany({
      where: currentCategoryId
        ? { OR: [{ isActive: true }, { id: currentCategoryId }] }
        : { isActive: true },
      orderBy: [{ sortOrder: 'asc' }, { createdAt: 'asc' }],
      include: { translations: true },
    }),
    prisma.client.findMany({ orderBy: { name: 'asc' }, select: { id: true, name: true } }),
  ]);

  return {
    cities: cities.map((c): SelectOption => ({
      value: c.id,
      label: c.state ? `${c.name}, ${c.state}` : c.name,
    })),
    jobTypes: jobTypes.map((t): SelectOption => ({ value: t.id, label: t.name })),
    campaigns: campaigns.map((c): SelectOption => ({ value: c.id, label: c.title })),
    clients: clients.map((c): SelectOption => ({ value: c.id, label: c.name })),
    categories: categories.map((c): SelectOption => ({
      value: c.id,
      label: c.isActive ? categoryDisplayName(c) : `${categoryDisplayName(c)} (hidden)`,
    })),
  };
}

// ─── Candidates (job applications) ───────────────────────────────────────────

const applicationListInclude = {
  job: { select: { id: true, title: true } },
  candidate: { select: { id: true, firstName: true, lastName: true, email: true, phone: true, status: true } },
} satisfies Prisma.JobApplicationInclude;

export type ApplicationListRow = Prisma.JobApplicationGetPayload<{ include: typeof applicationListInclude }>;

export const CANDIDATE_SORT_KEYS = ['name', 'job', 'status', 'createdAt'] as const;
export type CandidateSortKey = (typeof CANDIDATE_SORT_KEYS)[number];

const applicationOrderBy: Record<
  CandidateSortKey,
  (dir: SortDir) => Prisma.JobApplicationOrderByWithRelationInput[]
> = {
  name: (dir) => [{ candidate: { lastName: dir } }, { candidate: { firstName: dir } }],
  job: (dir) => [{ job: { title: dir } }, { createdAt: 'desc' }],
  status: (dir) => [{ status: dir }, { createdAt: 'desc' }],
  createdAt: (dir) => [{ createdAt: dir }],
};

/** One page of applications matching `q` by name, email or job title. Default order is newest first. */
export async function listApplications(
  params: ListParams<CandidateSortKey>,
  jobId?: string,
  status?: ApplicationStatus
): Promise<Paginated<ApplicationListRow>> {
  const user = await requireView('candidates');
  const { q, sort } = params;
  const where: Prisma.JobApplicationWhereInput = scoped<Prisma.JobApplicationWhereInput>(applicationScope(user), {
    ...(jobId ? { jobId } : {}),
    ...(status ? { status } : {}),
    ...(q
      ? {
          OR: [
            { candidate: { firstName: { contains: q, mode: 'insensitive' } } },
            { candidate: { lastName: { contains: q, mode: 'insensitive' } } },
            { candidate: { email: { contains: q, mode: 'insensitive' } } },
            { job: { title: { contains: q, mode: 'insensitive' } } },
          ],
        }
      : {}),
  });

  return fetchPage(
    params,
    () => prisma.jobApplication.count({ where }),
    ({ skip, take }) =>
      prisma.jobApplication.findMany({
        where,
        orderBy: [
          ...(sort ? applicationOrderBy[sort.key](sort.dir) : [{ createdAt: 'desc' as const }]),
          { id: 'asc' },
        ],
        include: applicationListInclude,
        skip,
        take,
      })
  );
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

/** One application with its person, their other applications, the job's capacity and the history. */
export async function getApplication(id: string) {
  const user = await requireView('candidates');
  const client = isClientUser(user);
  const application = await prisma.jobApplication.findFirst({
    where: scoped(applicationScope(user), { id }),
    include: {
      job: {
        select: {
          id: true,
          title: true,
          status: true,
          totalPositions: true,
          filledPositions: true,
          city: { select: { name: true } },
        },
      },
      candidate: {
        include: {
          applications: {
            // Other applications name other clients' jobs: never for client users.
            where: client ? { id: { in: [] } } : { id: { not: id } },
            orderBy: { createdAt: 'desc' },
            select: { id: true, status: true, createdAt: true, job: { select: { title: true } } },
          },
        },
      },
      events: {
        // The internal pipeline before submission (and who moved it) stays with the agency.
        where: client ? { id: { in: [] } } : {},
        orderBy: { createdAt: 'desc' },
        include: { actor: { select: { name: true, email: true } } },
      },
    },
  });
  // Interview and the hiring decision: admins, and the client's own users (same rule as requireApplicationManager).
  const viewerCanManage = canEdit(user.role) || client;
  return application ? { ...application, viewerIsClient: client, viewerCanManage } : null;
}

export type ApplicationDetail = NonNullable<Awaited<ReturnType<typeof getApplication>>>;

/** Where an application's CV is stored, for the signed-link route. */
export async function getApplicationCv(id: string) {
  const user = await requireView('candidates');
  return prisma.jobApplication.findFirst({ where: scoped(applicationScope(user), { id }), select: { cvPath: true, cvUrl: true } });
}

// ─── Talent pool (people) ────────────────────────────────────────────────────

export const PEOPLE_SORT_KEYS = ['name', 'status', 'createdAt'] as const;
export type PeopleSortKey = (typeof PEOPLE_SORT_KEYS)[number];

const peopleOrderBy: Record<PeopleSortKey, (dir: SortDir) => Prisma.CandidateOrderByWithRelationInput[]> = {
  name: (dir) => [{ lastName: dir }, { firstName: dir }],
  status: (dir) => [{ status: dir }, { createdAt: 'desc' }],
  createdAt: (dir) => [{ createdAt: dir }],
};

const personListInclude = {
  _count: { select: { applications: true } },
  applications: {
    orderBy: { createdAt: 'desc' },
    take: 1,
    select: { status: true, job: { select: { title: true } } },
  },
} satisfies Prisma.CandidateInclude;

export type PersonListRow = Prisma.CandidateGetPayload<{ include: typeof personListInclude }>;

export type PeopleFilters = { status?: CandidateStatus; withoutJob?: boolean };

/** One page of people matching `q` by name, email or phone; newest first by default. Admin and viewer only. */
export async function listPeople(
  params: ListParams<PeopleSortKey>,
  filters: PeopleFilters = {}
): Promise<Paginated<PersonListRow>> {
  await requireView('people');
  const { q, sort } = params;
  const where: Prisma.CandidateWhereInput = {
    ...(filters.status ? { status: filters.status } : {}),
    ...(filters.withoutJob ? { applications: { none: {} } } : {}),
    ...(q
      ? {
          OR: [
            { firstName: { contains: q, mode: 'insensitive' } },
            { lastName: { contains: q, mode: 'insensitive' } },
            { email: { contains: q, mode: 'insensitive' } },
            { phone: { contains: q } },
          ],
        }
      : {}),
  };
  return fetchPage(
    params,
    () => prisma.candidate.count({ where }),
    ({ skip, take }) =>
      prisma.candidate.findMany({
        where,
        orderBy: [...(sort ? peopleOrderBy[sort.key](sort.dir) : [{ createdAt: 'desc' as const }]), { id: 'asc' }],
        include: personListInclude,
        skip,
        take,
      })
  );
}

/** Talent pool counts for the filter tabs. */
export async function getPeopleCounts() {
  await requireView('people');
  const [byStatus, withoutJob] = await Promise.all([
    prisma.candidate.groupBy({ by: ['status'], _count: { _all: true } }),
    prisma.candidate.count({ where: { applications: { none: {} } } }),
  ]);
  const counts = { all: 0, open: 0, hired: 0, inactive: 0, withoutJob };
  for (const row of byStatus) {
    counts.all += row._count._all;
    if (row.status in counts) counts[row.status as CandidateStatus] = row._count._all;
  }
  return counts;
}

export async function getPerson(id: string) {
  await requireView('people');
  if (!isUuid(id)) return null;
  return prisma.candidate.findUnique({
    where: { id },
    include: {
      applications: {
        orderBy: { createdAt: 'desc' },
        select: { id: true, status: true, createdAt: true, job: { select: { id: true, title: true, client: { select: { name: true } } } } },
      },
    },
  });
}

export type PersonDetail = NonNullable<Awaited<ReturnType<typeof getPerson>>>;

/** Where a person's own CV is stored, for the signed-link route. */
export async function getPersonCv(id: string) {
  await requireView('people');
  if (!isUuid(id)) return null;
  const person = await prisma.candidate.findUnique({ where: { id }, select: { cvPath: true, cvUrl: true } });
  return person?.cvUrl ? { cvPath: person.cvPath, cvUrl: person.cvUrl } : null;
}

/** Jobs a person can be assigned to: not closed, with a position left, not applied for yet. */
export async function getAssignableJobOptions(personId: string): Promise<SelectOption[]> {
  await requireAdmin();
  const jobs = await prisma.job.findMany({
    where: { status: { not: 'closed' }, applications: { none: { candidateId: personId } } },
    orderBy: { createdAt: 'desc' },
    select: { id: true, title: true, status: true, totalPositions: true, filledPositions: true, client: { select: { name: true } } },
  });
  return jobs
    .filter((j) => j.filledPositions < j.totalPositions)
    .map((j) => ({
      value: j.id,
      label: `${j.title} · ${j.client.name}${j.status === 'draft' ? ' (draft)' : ''} · ${j.totalPositions - j.filledPositions} open`,
    }));
}

// ─── Users ───────────────────────────────────────────────────────────────────

const userListSelect = {
  id: true,
  email: true,
  name: true,
  role: true,
  clientId: true,
  client: { select: { name: true } },
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

  return fetchPage(
    params,
    () => prisma.user.count({ where }),
    ({ skip, take }) =>
      prisma.user.findMany({
        where,
        orderBy: [...(sort ? userOrderBy[sort.key](sort.dir) : [{ email: 'asc' as const }]), { id: 'asc' }],
        select: userListSelect,
        skip,
        take,
      })
  );
}

/** Clients a Client-role user can be linked to, A–Z. */
export async function getClientOptions(): Promise<SelectOption[]> {
  await requireAdmin();
  const clients = await prisma.client.findMany({ orderBy: { name: 'asc' }, select: { id: true, name: true } });
  return clients.map((c) => ({ value: c.id, label: c.name }));
}

export async function getUser(id: string) {
  await requireView('users');
  if (!isUuid(id)) return null;
  return prisma.user.findUnique({ where: { id }, select: userListSelect });
}

// ─── Site settings ───────────────────────────────────────────────────────────

/** The settings row for the admin form; null until it's first saved. */
export async function getSiteSettings() {
  await requireView('settings');
  return prisma.siteSetting.findUnique({ where: { id: SITE_SETTING_ID } });
}
