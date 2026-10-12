import type { JobsQuery } from "@/queries/job";

/** React Query keys. Build keys here so every reader of the same data shares one cache entry. */
export const jobsKeys = {
  all: ["jobs"] as const,
  list: (query: JobsQuery) => [...jobsKeys.all, "list", query] as const,
};
