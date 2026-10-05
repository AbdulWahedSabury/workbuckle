import { prisma } from '@/lib/prisma';
import { requireAdmin } from '@/lib/admin/auth';
import { paginate, type ListParams, type Paginated, type SortDir } from '@/lib/admin/list-params';
import type { City, Prisma } from '@/lib/generated/prisma/client';
import { defaultLocale } from '@/types/locale';

/** SiteSetting is a single-row table; this is that row's id. */
export const SITE_SETTING_ID = 1;

// Ids come from the URL; a malformed one would make Postgres reject the query.
const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export async function getAdminCounts() {
  await requireAdmin();
  const [categories, activeCategories, cities] = await Promise.all([
    prisma.jobCategory.count(),
    prisma.jobCategory.count({ where: { isActive: true } }),
    prisma.city.count(),
  ]);
  return { categories, activeCategories, cities };
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

type CategoryWithTranslations = Prisma.JobCategoryGetPayload<{ include: { translations: true } }>;

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
    const all = await prisma.jobCategory.findMany({ where, include: { translations: true } });
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
    include: { translations: true },
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
export async function listCities(params: ListParams<CitySortKey>): Promise<Paginated<City>> {
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

export async function getSiteSettings() {
  await requireAdmin();
  return prisma.siteSetting.findUnique({ where: { id: SITE_SETTING_ID } });
}
