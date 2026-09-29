import { API } from "@/constants/api";
import { JobDetailsResponse, JobListResponse } from "@/types/job";
import { Locale } from "next-intl";

export async function fetchJobs(query: string): Promise<JobListResponse> {
 const res = await fetch(`${API.JOBS}?${query}`);
  if (!res.ok) throw new Error('...');
  return res.json();
}
export async function fetchJob(
  id: string,
  locale: Locale
): Promise<JobDetailsResponse> {
  const res = await fetch(`${API.JOBS}/${id}?locale=${locale}`);
  if (!res.ok) throw new Error('...');
  return res.json();
}