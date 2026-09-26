import type { Job, JobFilter } from "@/lib/home/types";

export function matchesFilter(job: Job, filter: JobFilter): boolean {
  if (filter === "All") return true;
  if (filter === "Remote") return job.remote;
  return job.schedule === filter;
}
