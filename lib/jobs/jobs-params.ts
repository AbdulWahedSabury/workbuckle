// Client-safe: shared by the /jobs Server Component (to query) and the client
// filters (to write the URL), so both sides agree on one query-string format:
//   /jobs?search=<text>&location=<city-slug>&type=<job-type-slug>&category=<category-slug>&page=<n>
// The home page's job board reads `location` from its own URL the same way,
// and its category cards link here with `category` set.

export const JOBS_PAGE_SIZE = 10;
export const MAX_SEARCH_LENGTH = 100;

export const JOBS_PARAM = {
  search: "search",
  location: "location",
  type: "type",
  category: "category",
  page: "page",
} as const;

export type JobsListParams = {
  /** Trimmed search text; '' when absent. */
  search: string;
  /** City slug, e.g. "limassol"; '' for every city. */
  location: string;
  /** Job type slug, e.g. "full-time"; '' for every type. */
  type: string;
  /** Job category slug, e.g. "hospitality"; '' for every category. */
  category: string;
  /** 1-based. Not yet clamped to the page count; see `fetchPage`. */
  page: number;
};

/** No filters: every published job, first page. */
export const EMPTY_JOBS_PARAMS: JobsListParams = {
  search: "",
  location: "",
  type: "",
  category: "",
  page: 1,
};

/** True when anything narrows the result set (the page number doesn't). */
export function hasJobsFilters({ search, location, type, category }: JobsListParams): boolean {
  return Boolean(search || location || type || category);
}

type RawParams = Record<string, string | string[] | undefined>;

const SLUG = /^[a-z0-9-]{1,140}$/;

function first(value: string | string[] | undefined): string | undefined {
  return Array.isArray(value) ? value[0] : value;
}

/**
 * Reads the list params from the page's `searchParams`. Everything here comes
 * straight from the URL, so values are trimmed, capped and checked against
 * the shape of a slug before they reach the database.
 */
export function parseJobsParams(raw: RawParams): JobsListParams {
  const search = (first(raw[JOBS_PARAM.search]) ?? "").trim().slice(0, MAX_SEARCH_LENGTH);
  const location = first(raw[JOBS_PARAM.location])?.toLowerCase() ?? "";
  const type = first(raw[JOBS_PARAM.type])?.toLowerCase() ?? "";
  const category = first(raw[JOBS_PARAM.category])?.toLowerCase() ?? "";
  const page = Number(first(raw[JOBS_PARAM.page]));

  return {
    search,
    location: SLUG.test(location) ? location : "",
    type: SLUG.test(type) ? type : "",
    category: SLUG.test(category) ? category : "",
    page: Number.isInteger(page) && page > 1 ? page : 1,
  };
}

/** The query string for `params`. Defaults are left out so URLs stay short. */
export function writeJobsParams({ search, location, type, category, page }: JobsListParams): URLSearchParams {
  const query = new URLSearchParams();
  if (search) query.set(JOBS_PARAM.search, search);
  if (location) query.set(JOBS_PARAM.location, location);
  if (type) query.set(JOBS_PARAM.type, type);
  if (category) query.set(JOBS_PARAM.category, category);
  if (page > 1) query.set(JOBS_PARAM.page, String(page));
  return query;
}
