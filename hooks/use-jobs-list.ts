"use client";

import { useEffect, useMemo, useState, type FormEvent } from "react";
import { useQuery } from "@tanstack/react-query";
import { useLocale } from "next-intl";

import { jobsKeys } from "@/constants/query-keys";
import { fetchJobs } from "@/queries/job";
import { JobFilter, PublicJobSummary, matchesFilter } from "@/types/job";

const STALE_TIME = 1000 * 60 * 5;
const GC_TIME = 1000 * 60 * 30;
const PAGE_SIZE = 10;
const DEBOUNCE_MS = 350;

/**
 * Every job matching `search` in the current locale. The home page's job
 * board and the jobs page both read through this, so they share one cache.
 */
export function useJobs(search = "") {
  const locale = useLocale();
  return useQuery({
    queryKey: jobsKeys.list({ search, locale }),
    queryFn: ({ queryKey: [, , query] }) => fetchJobs(query),
    staleTime: STALE_TIME,
    gcTime: GC_TIME,
    placeholderData: (previousData) => previousData,
  });
}

export interface UseJobsListResult {
  searchInput: string;
  setSearchInput: (value: string) => void;
  onSearchSubmit: (event: FormEvent<HTMLFormElement>) => void;
  filter: JobFilter;
  onFilterChange: (filter: JobFilter) => void;
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  visibleJobs: PublicJobSummary[];
  roleCount: number;
  isPending: boolean;
  isError: boolean;
  isFetching: boolean;
}

/**
 * Owns all state for the jobs list page: debounced search (sent to the API),
 * location filter and pagination (both applied here, so changing them never
 * refetches).
 */
export function useJobsList(): UseJobsListResult {
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

  const { data, isPending, isError, isFetching, isPlaceholderData } = useJobs(debouncedSearch);

  const filteredJobs = useMemo(
    () => (data ?? []).filter((job) => matchesFilter(job, filter)),
    [data, filter]
  );

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
