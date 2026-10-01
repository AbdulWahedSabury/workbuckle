import { fetchJobs } from "@/queries/job";
import { JobDetailsResponse, JobListResponse } from "@/types/job";

export interface JobsListParams {
  search: string;
  locale: string;
}

export interface JobsListResult {
  jobs: JobDetailsResponse[];
  searchedByServer: boolean;
}

// Location is filtered on the client (same as the home JobBoard), so it is
// not sent to the API.
function buildJobsQuery(params: JobsListParams, page: number): string {
  const searchParams = new URLSearchParams();
  if (params.search) searchParams.set("search", params.search);
  searchParams.set("page", String(page));
  searchParams.set("locale", params.locale);
  return searchParams.toString();
}

/** Jobs from one response, whether the API sent { results } or a plain array. */
function jobsOf(data: JobListResponse | JobDetailsResponse[] | undefined): JobDetailsResponse[] {
  if (Array.isArray(data)) return data;
  return data?.results ?? [];
}

/**
 * Loads every page of results for a search, so the location filter and the
 * pagination both work on the full list (filtering one 10-job API page at a
 * time is what made pages come out short or empty).
 */
export async function fetchAllJobs(params: JobsListParams): Promise<JobsListResult> {
  const first = await fetchJobs(buildJobsQuery(params, 1));
  const firstJobs = jobsOf(first);

  // A plain array is already the whole list.
  if (Array.isArray(first)) return { jobs: firstJobs, searchedByServer: false };

  const count = typeof first.count === "number" ? first.count : firstJobs.length;
  const perPage = firstJobs.length;
  const pageCount = perPage > 0 ? Math.ceil(count / perPage) : 1;

  const rest = await Promise.all(
    Array.from({ length: pageCount - 1 }, (_, i) => fetchJobs(buildJobsQuery(params, i + 2)))
  );

  // De-duplicate in case jobs shift between pages while loading.
  const seen = new Set<number>();
  const jobs = [firstJobs, ...rest.map(jobsOf)].flat().filter((job) => {
    if (seen.has(job.id)) return false;
    seen.add(job.id);
    return true;
  });

  return { jobs, searchedByServer: true };
}
