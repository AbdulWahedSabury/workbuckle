// Client-safe: shared by Server Components (to query) and the client hooks
// (to write the URL), so both sides agree on one query-string format:
//   ?q=<search>&sort=<key>&dir=asc|desc&page=<n>&size=<n>

export type SortDir = 'asc' | 'desc';

export type SortState<K extends string = string> = { key: K; dir: SortDir };

export type ListParams<K extends string = string> = {
  /** Trimmed search text; '' when absent. */
  q: string;
  /** null = no explicit sort, i.e. the list's default order. */
  sort: SortState<K> | null;
  /** 1-based. Not yet clamped to the page count; see `paginate`. */
  page: number;
  pageSize: PageSize;
};

export const LIST_PARAM = {
  search: 'q',
  sort: 'sort',
  dir: 'dir',
  page: 'page',
  size: 'size',
} as const;

export const PAGE_SIZES = [10, 20, 50] as const;
export type PageSize = (typeof PAGE_SIZES)[number];
export const DEFAULT_PAGE_SIZE: PageSize = 20;

type RawParams = Record<string, string | string[] | undefined>;

function first(value: string | string[] | undefined): string | undefined {
  return Array.isArray(value) ? value[0] : value;
}

function isSortDir(value: string | null | undefined): value is SortDir {
  return value === 'asc' || value === 'desc';
}

function toPage(value: string | null | undefined): number {
  const n = Number(value);
  return Number.isInteger(n) && n > 1 ? n : 1;
}

function toPageSize(value: string | null | undefined): PageSize {
  const n = Number(value);
  return (PAGE_SIZES as readonly number[]).includes(n) ? (n as PageSize) : DEFAULT_PAGE_SIZE;
}

/**
 * Reads list params from a page's `searchParams`. Sort keys come straight from
 * the URL, so anything not in `sortKeys` is dropped rather than passed on to
 * the database.
 */
export function parseListParams<K extends string>(
  raw: RawParams,
  sortKeys: readonly K[]
): ListParams<K> {
  const q = first(raw[LIST_PARAM.search])?.trim() ?? '';
  const key = first(raw[LIST_PARAM.sort]);
  const dir = first(raw[LIST_PARAM.dir]);

  const sort =
    key && (sortKeys as readonly string[]).includes(key) && isSortDir(dir)
      ? { key: key as K, dir }
      : null;

  return {
    q,
    sort,
    page: toPage(first(raw[LIST_PARAM.page])),
    pageSize: toPageSize(first(raw[LIST_PARAM.size])),
  };
}

/** Same as parseListParams, for the client's `useSearchParams()`. */
export function readListParams(
  params: { get(name: string): string | null }
): ListParams {
  const q = params.get(LIST_PARAM.search)?.trim() ?? '';
  const key = params.get(LIST_PARAM.sort);
  const dir = params.get(LIST_PARAM.dir);
  return {
    q,
    sort: key && isSortDir(dir) ? { key, dir } : null,
    page: toPage(params.get(LIST_PARAM.page)),
    pageSize: toPageSize(params.get(LIST_PARAM.size)),
  };
}

/** Header click cycle: none → ascending → descending → none. */
export function nextSort<K extends string>(
  current: SortState<K> | null,
  key: K
): SortState<K> | null {
  if (current?.key !== key) return { key, dir: 'asc' };
  return current.dir === 'asc' ? { key, dir: 'desc' } : null;
}

/**
 * Returns a copy of `base` with the list params replaced. Unrelated params are
 * kept; empty values are removed so URLs stay short.
 */
export function writeListParams(
  base: URLSearchParams,
  { q, sort, page, pageSize }: ListParams
): URLSearchParams {
  const next = new URLSearchParams(base);
  if (q) next.set(LIST_PARAM.search, q);
  else next.delete(LIST_PARAM.search);

  if (sort) {
    next.set(LIST_PARAM.sort, sort.key);
    next.set(LIST_PARAM.dir, sort.dir);
  } else {
    next.delete(LIST_PARAM.sort);
    next.delete(LIST_PARAM.dir);
  }

  if (page > 1) next.set(LIST_PARAM.page, String(page));
  else next.delete(LIST_PARAM.page);

  if (pageSize !== DEFAULT_PAGE_SIZE) next.set(LIST_PARAM.size, String(pageSize));
  else next.delete(LIST_PARAM.size);
  return next;
}

export type PageInfo = {
  /** Clamped into 1..pageCount. */
  page: number;
  pageSize: number;
  pageCount: number;
  total: number;
};

/**
 * Clamps a requested page to what `total` allows (page 9 of 3 → page 3) and
 * returns the matching offset for the query.
 */
export function paginate(
  { page, pageSize }: Pick<ListParams, 'page' | 'pageSize'>,
  total: number
): PageInfo & { skip: number; take: number } {
  const pageCount = Math.max(1, Math.ceil(total / pageSize));
  const current = Math.min(page, pageCount);
  return {
    page: current,
    pageSize,
    pageCount,
    total,
    skip: (current - 1) * pageSize,
    take: pageSize,
  };
}

/** A page of rows plus where it sits in the full result. */
export type Paginated<T> = PageInfo & { rows: T[] };

/**
 * Page numbers to show, with 'gap' for elided runs. Always includes the
 * first, last and `siblings` pages either side of the current one, and keeps
 * the length constant so the control doesn't jump around as you page.
 *   pageRange(6, 12) → [1, 'gap', 5, 6, 7, 'gap', 12]
 */
export function pageRange(
  current: number,
  pageCount: number,
  siblings = 1
): (number | 'gap')[] {
  const slots = siblings * 2 + 5; // first, last, current, 2 gaps
  if (pageCount <= slots) {
    return Array.from({ length: pageCount }, (_, i) => i + 1);
  }

  const span = siblings * 2 + 3; // run attached to an edge when no gap is needed
  if (current <= siblings + 3) {
    return [...Array.from({ length: span }, (_, i) => i + 1), 'gap', pageCount];
  }
  if (current >= pageCount - siblings - 2) {
    return [1, 'gap', ...Array.from({ length: span }, (_, i) => pageCount - span + 1 + i)];
  }
  return [
    1,
    'gap',
    ...Array.from({ length: siblings * 2 + 1 }, (_, i) => current - siblings + i),
    'gap',
    pageCount,
  ];
}
