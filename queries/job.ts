import { API } from "@/constants/api";
import { JobDetailsResponse, JobListResponse } from "@/types/job";
import { Locale } from "next-intl";

export async function fetchJobs(query: string): Promise<JobListResponse> {
  let allResults: JobDetailsResponse[] = [];
  let nextUrl: string | null = `${API.JOBS}?${query}`;
  let totalCount = 0;
  while (nextUrl) {
    const res = await fetch(nextUrl);
    if (!res.ok) {
      throw new Error(`Failed to fetch jobs: ${res.statusText}`);
    }
    const data: JobListResponse = await res.json();
    allResults = [...allResults, ...data.results];
    totalCount = data.count;
    nextUrl = data.next;
  }
  return {
    count: totalCount,
    next: null,
    previous: null,
    results: allResults,
  };
}

export async function fetchJob(
  id: string,
  locale: Locale
): Promise<JobDetailsResponse> {
  const res = await fetch(`${API.JOBS}/${id}?locale=${locale}`);
  if (!res.ok) throw new Error('...');
  return res.json();
}