import type { PublicJobSummary } from "@/types/job";

export interface JobsQuery {
  search: string;
  locale: string;
}

/** Every published job matching `search`, from this app's own API (app/api/jobs/route.ts). */
export async function fetchJobs({ search, locale }: JobsQuery): Promise<PublicJobSummary[]> {
  const params = new URLSearchParams({ locale });
  if (search) params.set("search", search);

  const res = await fetch(`/api/jobs?${params}`);
  if (!res.ok) throw new Error(`Failed to fetch jobs: ${res.status} ${res.statusText}`);
  const data: { jobs: PublicJobSummary[] } = await res.json();
  return data.jobs;
}
