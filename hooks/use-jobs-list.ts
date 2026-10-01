"use client";

import { useEffect, useMemo, useState, type FormEvent } from "react";
import { useQuery } from "@tanstack/react-query";
import { useLocale } from "next-intl";

import { JOBS_QUERY_KEY } from "@/constants/query-keys";
import { fetchAllJobs, type JobsListParams } from "@/queries/jobs-list";
import { JobDetailsResponse, JobFilter, matchesFilter } from "@/types/job";

const STALE_TIME = 1000 * 60 * 5;
const GC_TIME = 1000 * 60 * 30;
const PAGE_SIZE = 10;
const DEBOUNCE_MS = 350;

export interface UseJobsListResult {
  searchInput: string;
  setSearchInput: (value: string) => void;
  onSearchSubmit: (event: FormEvent<HTMLFormElement>) => void;
  filter: JobFilter;
  onFilterChange: (filter: JobFilter) => void;
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  visibleJobs: JobDetailsResponse[];
  roleCount: number;
  isPending: boolean;
  isError: boolean;
  isFetching: boolean;
}

/** Matches a job against a lowercased free-text search term. */
function matchesSearchTerm(job: JobDetailsResponse, term: string): boolean {
  if (!term) return true;
  return Boolean(
    job.position_name?.toLowerCase().includes(term) ||
      job.description?.toLowerCase().includes(term) ||
      job.location_display?.toLowerCase().includes(term)
  );
}

/**
 * Owns all state and data-fetching for the jobs list page: debounced search,
 * location filter, pagination, and the underlying query. The API's `search`
 * param already narrows results server-side; the location filter and, when
 * the API ever returns a plain array, the search term too, are applied here
 * on the client.
 */
export function useJobsList(): UseJobsListResult {
  const locale = useLocale();

  const [searchInput, setSearchInput] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [filter, setFilter] = useState<JobFilter>("All");
  const [currentPage, setCurrentPage] = useState(1);

  // Debounce typing; reset to page 1 in the same update as the new term.
  useEffect(() => {
    const next = searchInput.trim();
    if (next === debouncedSearch) return;

    const handler = setTimeout(() => {
      setDebouncedSearch(next);
      setCurrentPage(1);
    }, DEBOUNCE_MS);
    return () => clearTimeout(handler);
  }, [searchInput, debouncedSearch]);

  // Page and location are not in the key: changing them never refetches.
  const params: JobsListParams = { search: debouncedSearch, locale };

  const { data, isPending, isError, isFetching, isPlaceholderData } = useQuery({
    queryKey: [JOBS_QUERY_KEY, "all", params] as const,
    queryFn: ({ queryKey: [, , p] }) => fetchAllJobs(p),
    staleTime: STALE_TIME,
    gcTime: GC_TIME,
    placeholderData: (previousData) => previousData,
  });

  const filteredJobs = useMemo(() => {
    if (!data) return [];
    const term = data.searchedByServer ? "" : debouncedSearch.toLowerCase();
    return data.jobs.filter((job) => matchesFilter(job, filter) && matchesSearchTerm(job, term));
  }, [data, debouncedSearch, filter]);

  const roleCount = filteredJobs.length;
  const totalPages = Math.max(1, Math.ceil(roleCount / PAGE_SIZE));

  const visibleJobs = useMemo(
    () => filteredJobs.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE),
    [filteredJobs, currentPage]
  );

  // Keep the page in range if the result set shrinks. Skipped while showing
  // placeholder data, whose page count belongs to the previous query.
  useEffect(() => {
    if (data && !isPlaceholderData && currentPage > totalPages) {
      setCurrentPage(totalPages);
    }
  }, [data, isPlaceholderData, currentPage, totalPages]);

  const onSearchSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const next = searchInput.trim();
    if (next === debouncedSearch) return;
    setDebouncedSearch(next);
    setCurrentPage(1);
  };

  const onFilterChange = (next: JobFilter) => {
    if (next === filter) return;
    setFilter(next);
    setCurrentPage(1);
  };

  const onPageChange = (page: number) => {
    const target = Math.min(Math.max(page, 1), totalPages);
    if (target === currentPage) return;
    setCurrentPage(target);
    document.getElementById("job-feed")?.scrollIntoView({ behavior: "smooth" });
  };

  return {
    searchInput,
    setSearchInput,
    onSearchSubmit,
    filter,
    onFilterChange,
    currentPage,
    totalPages,
    onPageChange,
    visibleJobs,
    roleCount,
    isPending,
    isError,
    isFetching,
  };
}
