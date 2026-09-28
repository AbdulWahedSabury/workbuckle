// @/lib/home/jobs.ts
import type { JobFilter } from "./types";

interface ManatalJob {
  id: number;
  contract_details: string; // Manatal yields e.g., "full_time" or ""
  is_remote: boolean | null;
}

export function matchesFilter(job: ManatalJob, filter: JobFilter): boolean {
  // 1. "All" always allows every record through
  if (filter === "All") return true;

  // 2. Validate against Manatal's boolean flag for remote roles
  if (filter === "Remote") {
    return job.is_remote === true;
  }

  // 3. Map display UI strings directly to lowercase snake_case API options
  const filterMapping: Record<string, string> = {
    "Full-Time": "full_time",
    "Part-Time": "part_time",
    Internship: "internship",
  };

  const targetContractDetail = filterMapping[filter];

  // Return true only if it strictly matches the calculated slug value
  return job.contract_details === targetContractDetail;
}
