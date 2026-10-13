"use client";

import { createContext, startTransition, use, useOptimistic, type ReactNode } from "react";
import { usePathname, useRouter } from "next/navigation";
import {
  EMPTY_JOBS_PARAMS,
  hasJobsFilters,
  writeJobsParams,
  type JobsListParams,
} from "@/lib/jobs/jobs-params";

type JobsQuery = JobsListParams & {
  /** True while the server is rendering results for a new query. */
  isPending: boolean;
  /** True when search, location, type, category or campaign narrows the list. */
  hasFilters: boolean;
  setSearch: (search: string) => void;
  /** City slug; '' for every city. */
  setLocation: (location: string) => void;
  setType: (type: string) => void;
  /** Category slug; '' for every category. */
  setCategory: (category: string) => void;
  /** Campaign id; '' for every campaign. */
  setCampaign: (campaign: string) => void;
  setPage: (page: number) => void;
  clearFilters: () => void;
  /** URL for these params with `page` swapped, for real <a href>s. */
  hrefForPage: (page: number) => string;
};

const JobsQueryContext = createContext<JobsQuery | null>(null);

/**
 * Single owner of a job list's filters (the /jobs page, the home page's job
 * board). The URL is the source of truth: the page parses it on the server and
 * passes `params` down; this provider writes it back and holds one transition
 * so the search box, filters, list and pagination share the same pending state.
 */
export function JobsQueryProvider({
  params: serverParams,
  children,
}: {
  params: JobsListParams;
  children: ReactNode;
}) {
  const router = useRouter();
  const pathname = usePathname();

  // Optimistic copy of the URL state: controls reflect a change on the current
  // frame, and a second change made mid-navigation builds on the first.
  const [params, setOptimisticParams] = useOptimistic(serverParams);
  const [isPending, setIsPending] = useOptimistic(false);

  function hrefFor(next: JobsListParams) {
    const query = writeJobsParams(next).toString();
    return query ? `${pathname}?${query}` : pathname;
  }

  // Filters use replace (no history entry per keystroke); paging pushes, so
  // Back returns to the previous page.
  function navigate(next: JobsListParams, mode: "replace" | "push" = "replace") {
    startTransition(() => {
      setOptimisticParams(next);
      setIsPending(true);
      router[mode](hrefFor(next), { scroll: false });
    });
  }

  const value: JobsQuery = {
    ...params,
    isPending,
    hasFilters: hasJobsFilters(params),
    // Anything that changes the result set starts again from page 1.
    setSearch(search) {
      const trimmed = search.trim();
      if (trimmed !== params.search) navigate({ ...params, search: trimmed, page: 1 });
    },
    setLocation(location) {
      if (location !== params.location) navigate({ ...params, location, page: 1 });
    },
    setType(type) {
      if (type !== params.type) navigate({ ...params, type, page: 1 });
    },
    setCategory(category) {
      if (category !== params.category) navigate({ ...params, category, page: 1 });
    },
    setCampaign(campaign) {
      if (campaign !== params.campaign) navigate({ ...params, campaign, page: 1 });
    },
    setPage(page) {
      if (page === params.page) return;
      navigate({ ...params, page }, "push");
      document.getElementById("job-feed")?.scrollIntoView({ behavior: "smooth" });
    },
    clearFilters() {
      if (hasJobsFilters(params) || params.page > 1) navigate(EMPTY_JOBS_PARAMS);
    },
    hrefForPage: (page) => hrefFor({ ...params, page }),
  };

  return <JobsQueryContext value={value}>{children}</JobsQueryContext>;
}

export function useJobsQuery(): JobsQuery {
  const context = use(JobsQueryContext);
  if (!context) {
    throw new Error("useJobsQuery must be used inside <JobsQueryProvider>.");
  }
  return context;
}
