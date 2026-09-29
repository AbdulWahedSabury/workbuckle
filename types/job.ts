export type ContractType = "full_time" | "part_time" | "internship" | "temporary" | "freelance";

export interface JobDetailsResponse {
  id: number;
  hash: string;
  position_name: string;
  description?: string;
  country?: string;
  state?: string;
  city?: string;
  address?: string;
  zipcode?: string;
  location_display?: string;
  is_salary_visible?: boolean;
  is_remote?: boolean | null; // Note: API uses `is_remote`, not `remote`
  contract_details?: ContractType | string; // Note: API uses `contract_details`, not `contract_type`
  is_pinned_in_career_page?: boolean;
}

export interface JobListResponse {
  count: number;
  next: string | null;
  previous: string | null;
  results: JobDetailsResponse[];
}

export type JobFilter = "All" | "Limassol" | "Larnaca" | "Nicosia" | "Paphos";

export function matchesFilter(job: JobDetailsResponse, filter: JobFilter): boolean {
  if (filter === "All") return true;
  if (!job.city) return false;
  const normalizedFilter = filter.toLowerCase().replace(/[- ]/g, "_");
  const normalizedContract = job.city.toLowerCase().replace(/[- ]/g, "_");
  return normalizedContract === normalizedFilter;
}