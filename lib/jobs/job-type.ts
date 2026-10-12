/**
 * Key for job-type badge colours: admin slugs use hyphens ("full-time"), the
 * colour maps use underscores ("full_time"); both normalize to the latter.
 */
export function jobTypeKey(slug: string): string {
  return slug.toLowerCase().replace(/[-\s]+/g, "_");
}
