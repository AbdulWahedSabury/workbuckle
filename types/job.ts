/** A published job as the public list shows it (JSON from GET /api/jobs). */
export interface PublicJobSummary {
  id: string;
  title: string;
  salary: string;
  experience: string;
  city: string;
  /** Job type name, e.g. "Full-time". */
  jobType: string;
  /** Job type slug, e.g. "full-time"; picks the badge colour. */
  jobTypeSlug: string;
  /** Category name in the requested locale. */
  category: string;
}

/** A published job with everything its detail page shows. Rich-text fields are sanitized HTML. */
export interface PublicJob extends PublicJobSummary {
  /** "City, Region", or just the city. */
  location: string;
  description: string;
  responsibilities: string;
  requirements: string;
  benefits: string;
  categoryImage: string | null;
}

export type JobFilter = "All" | "Limassol" | "Larnaca" | "Nicosia" | "Paphos";

/** Location tabs match the job's city name, ignoring case, spaces and hyphens. */
export function matchesFilter(job: PublicJobSummary, filter: JobFilter): boolean {
  if (filter === "All") return true;
  const normalize = (value: string) => value.toLowerCase().replace(/[- ]/g, "_");
  return normalize(job.city) === normalize(filter);
}
