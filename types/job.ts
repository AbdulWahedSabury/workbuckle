/** A published job as the public lists show it. */
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

/** A job type in the /jobs type filter. */
export interface JobTypeOption {
  name: string;
  slug: string;
}

/** A city in the location filter, with how many published jobs it would show. */
export interface CityOption {
  name: string;
  slug: string;
  count: number;
}

/** A job category on the home page grid and in the /jobs category filter. */
export interface CategoryOption {
  /** Name in the requested locale. */
  name: string;
  slug: string;
  /** Category image (a photo or icon) from Supabase Storage; null when none was uploaded. */
  imageUrl: string | null;
  /** Lucide icon name (e.g. "code-xml"); null when none was picked. */
  icon: string | null;
  /** Published jobs in this category. */
  count: number;
}
