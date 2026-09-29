"use client";

import { useMemo, useState, useEffect, useCallback, type FormEvent } from "react";
import { useQuery } from "@tanstack/react-query";
import { useLocale } from "next-intl";
import { Search, SlidersHorizontal, X, ChevronLeft, ChevronRight } from "lucide-react";
import { AnimatePresence, motion } from "framer-motion";

import RevealSection from "@/components/motion/RevealSection";
import FadeUp from "@/components/motion/FadeUp";
import SectionHeader from "@/components/ui/SectionHeader";
import JobRow from "@/components/home/JobRow";

import { JOBS_QUERY_KEY } from "@/constants/query-keys";
import { fetchJobs } from "@/queries/job";
import { JobFilter, matchesFilter } from "@/types/job";

const LOCATION_FILTERS: JobFilter[] = ["All", "Limassol", "Larnaca", "Nicosia", "Paphos"];
const STALE_TIME = 1000 * 60 * 5;
const GC_TIME = 1000 * 60 * 30;
const PAGE_SIZE = 10;
const DEBOUNCE_MS = 350;

export default function JobsListPage() {
  const locale = useLocale();

  const [searchInput, setSearchInput] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [locationFilter, setLocationFilter] = useState<JobFilter>("All");
  const [isMobileFilterOpen, setIsMobileFilterOpen] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);

  // Debounce the search input. The page is reset in the same update as the
  // search change, so no request is ever fired for "new search + old page".
  useEffect(() => {
    const next = searchInput.trim();
    if (next === debouncedSearch) return;

    const handler = setTimeout(() => {
      setDebouncedSearch(next);
      setCurrentPage(1);
    }, DEBOUNCE_MS);
    return () => clearTimeout(handler);
  }, [searchInput, debouncedSearch]);

  // fetchJobs expects a query string, so build one from the current filters.
  const jobsQuery = useMemo(() => {
    const params = new URLSearchParams();
    if (debouncedSearch) params.set("search", debouncedSearch);
    if (locationFilter !== "All") params.set("location", locationFilter);
    params.set("page", String(currentPage));
    params.set("locale", locale);
    return params.toString();
  }, [debouncedSearch, locationFilter, currentPage, locale]);

  // Use the exact search string in the key: the request sends it as-is, so
  // "Chef" and "chef" must not share a cache entry.
  const { data, isPending, isError, isFetching } = useQuery({
    queryKey: [JOBS_QUERY_KEY, debouncedSearch, locationFilter, currentPage, locale],
    queryFn: () => fetchJobs(jobsQuery),
    staleTime: STALE_TIME,
    gcTime: GC_TIME,
    placeholderData: (previousData) => previousData,
  });

  // Memoised so the fallback [] is not a new array every render
  // (which made the filteredJobs useMemo recompute on every render).
  const apiJobs = useMemo(
    () => data?.results ?? (Array.isArray(data) ? data : []),
    [data]
  );
  const totalCount = data?.count ?? apiJobs.length;
  const totalPages = Math.max(1, Math.ceil(totalCount / PAGE_SIZE));

  // Client-side filter fallback
  const filteredJobs = useMemo(() => {
    const term = debouncedSearch.toLowerCase();

    return apiJobs.filter((job) => {
      const matchesSearch =
        !term ||
        job.title?.toLowerCase().includes(term) ||
        job.company?.toLowerCase().includes(term) ||
        job.description?.toLowerCase().includes(term);

      const matchesLoc = matchesFilter(job, locationFilter);

      // Previously nothing was returned here, so every job was filtered out.
      return Boolean(matchesSearch) && matchesLoc;
    });
  }, [apiJobs, debouncedSearch, locationFilter]);

  // Keep the current page in range if the result set shrinks.
  useEffect(() => {
    if (data && currentPage > totalPages) {
      setCurrentPage(totalPages);
    }
  }, [data, currentPage, totalPages]);

  const handleSearchSubmit = useCallback(
    (e: FormEvent<HTMLFormElement>) => {
      e.preventDefault();
      const next = searchInput.trim();
      if (next !== debouncedSearch) {
        setDebouncedSearch(next);
        setCurrentPage(1);
      }
    },
    [searchInput, debouncedSearch]
  );

  const handleLocationChange = (loc: JobFilter) => {
    if (loc !== locationFilter) {
      setLocationFilter(loc);
      setCurrentPage(1);
    }
    setIsMobileFilterOpen(false);
  };

  const handlePageChange = (page: number) => {
    const target = Math.min(Math.max(page, 1), totalPages);
    if (target === currentPage) return;
    setCurrentPage(target);
    document.getElementById("job-feed")?.scrollIntoView({ behavior: "smooth" });
  };

  // Close the mobile drawer on Escape and lock background scroll while open.
  useEffect(() => {
    if (!isMobileFilterOpen) return;

    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") setIsMobileFilterOpen(false);
    };
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", onKeyDown);

    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [isMobileFilterOpen]);

  // When the API returns a total, show it; otherwise count what is on screen.
  const roleCount = data?.count ?? filteredJobs.length;

  const FilterContent = (
    <div className="space-y-6">
      {/* Location Filter */}
      <div>
        <h3 className="mb-3 text-xs font-semibold uppercase tracking-wider text-gray-2">
          Location
        </h3>
        <div className="flex flex-wrap gap-2">
          {LOCATION_FILTERS.map((loc) => {
            const isActive = locationFilter === loc;
            return (
              <button
                key={loc}
                type="button"
                aria-pressed={isActive}
                onClick={() => handleLocationChange(loc)}
                className={`rounded-full px-3.5 py-1.5 text-xs font-semibold transition-all duration-200 sm:text-sm ${
                  isActive
                    ? "bg-ink text-white shadow-sm"
                    : "bg-gray-3 text-ink hover:bg-primary/15"
                }`}
              >
                {loc}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );

  return (
    <div className="w-full max-w-full overflow-x-hidden">
      {/* Hero Banner */}
      <RevealSection className="bg-ink px-4 pt-12 pb-16 sm:px-6 sm:pt-20 sm:pb-24 lg:pt-24 lg:pb-28">
        <div className="container-site mx-auto max-w-7xl">
          <FadeUp className="mx-auto max-w-3xl text-center">
            <span className="mb-3 inline-flex items-center rounded-full bg-white/10 px-3.5 py-1 text-xs font-semibold uppercase tracking-wider text-primary sm:mb-4 sm:px-4 sm:py-1.5 sm:text-sm">
              Jobs List
            </span>
            <h1 className="text-balance text-2xl font-bold tracking-tight text-white sm:text-4xl lg:text-6xl">
              Explore our diverse range of career opportunities
            </h1>
          </FadeUp>

          <FadeUp className="mx-auto mt-6 max-w-2xl sm:mt-10">
            <form
              onSubmit={handleSearchSubmit}
              role="search"
              className="flex flex-col gap-2 rounded-2xl bg-gray-1 p-2 sm:flex-row sm:items-center sm:rounded-full sm:p-2"
            >
              <label className="flex min-w-0 flex-1 items-center gap-2 px-3 py-2 text-white sm:gap-3 sm:px-4">
                <Search className="size-5 flex-none opacity-60" aria-hidden="true" />
                <span className="sr-only">Search jobs</span>
                <input
                  type="search"
                  value={searchInput}
                  onChange={(e) => setSearchInput(e.target.value)}
                  placeholder="Search job title, company or keyword"
                  className="w-full min-w-0 bg-transparent text-sm placeholder:text-white/60 focus:outline-none sm:text-base"
                />
              </label>
              <button
                type="submit"
                className="flex w-full flex-none items-center justify-center gap-2 rounded-xl bg-primary px-6 py-3 font-semibold text-ink transition-colors hover:bg-primary-dark sm:w-auto sm:rounded-full sm:py-3.5"
              >
                <Search className="size-5" aria-hidden="true" />
                <span>Search</span>
              </button>
            </form>
          </FadeUp>
        </div>
      </RevealSection>

      {/* Main Job Feed */}
      <RevealSection id="job-feed" className="section-spacing px-4 sm:px-6">
        <div className="container-site mx-auto max-w-7xl">
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-[260px_1fr] lg:gap-10">
            {/* Desktop Filters Sidebar */}
            <div className="hidden lg:block">
              <div className="sticky top-24 rounded-card border border-line bg-white p-6 shadow-sm">
                <h2 className="mb-6 text-lg font-bold text-ink">Filters</h2>
                {FilterContent}
              </div>
            </div>

            {/* Mobile Filter Toggle Button */}
            <div className="flex items-center justify-between lg:hidden">
              <button
                type="button"
                onClick={() => setIsMobileFilterOpen(true)}
                aria-expanded={isMobileFilterOpen}
                aria-controls="mobile-filter-drawer"
                className="inline-flex items-center gap-2 rounded-full border border-line bg-white px-4 py-2 text-sm font-semibold text-ink shadow-sm hover:bg-gray-3"
              >
                <SlidersHorizontal className="size-4" aria-hidden="true" />
                Filters
                {locationFilter !== "All" && (
                  <span className="rounded-full bg-ink px-2 py-0.5 text-xs text-white">
                    {locationFilter}
                  </span>
                )}
              </button>
            </div>

            {/* Mobile Drawer */}
            <AnimatePresence>
              {isMobileFilterOpen && (
                <>
                  <motion.div
                    key="filter-backdrop"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    onClick={() => setIsMobileFilterOpen(false)}
                    className="fixed inset-0 z-40 bg-ink/50 backdrop-blur-sm lg:hidden"
                    aria-hidden="true"
                  />
                  <motion.div
                    key="filter-drawer"
                    id="mobile-filter-drawer"
                    role="dialog"
                    aria-modal="true"
                    aria-label="Filters"
                    initial={{ x: "100%" }}
                    animate={{ x: 0 }}
                    exit={{ x: "100%" }}
                    transition={{ type: "spring", damping: 25, stiffness: 200 }}
                    className="fixed inset-y-0 right-0 z-50 w-full max-w-xs overflow-y-auto bg-white p-6 shadow-xl lg:hidden"
                  >
                    <div className="mb-6 flex items-center justify-between">
                      <h2 className="text-lg font-bold text-ink">Filters</h2>
                      <button
                        type="button"
                        onClick={() => setIsMobileFilterOpen(false)}
                        aria-label="Close filters"
                        className="rounded-full p-1 text-gray-2 hover:bg-gray-3"
                      >
                        <X className="size-5" aria-hidden="true" />
                      </button>
                    </div>
                    {FilterContent}
                  </motion.div>
                </>
              )}
            </AnimatePresence>

            {/* Job List Container */}
            <div className="min-w-0">
              <div className="mb-6 flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
                <SectionHeader
                  eyebrow="Job Feed"
                  title={
                    isPending
                      ? "Loading roles…"
                      : `${roleCount} open ${roleCount === 1 ? "role" : "roles"}`
                  }
                />
              </div>

              {/* Feed Display Container */}
              <div
                aria-busy={isFetching}
                className={`relative transition-opacity duration-300 ${
                  isFetching && !isPending ? "opacity-60" : "opacity-100"
                }`}
              >
                <AnimatePresence mode="wait">
                  {isPending ? (
                    <motion.div
                      key="loading"
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                      transition={{ duration: 0.2 }}
                      className="rounded-sm-card border border-line p-8 text-center text-sm sm:p-10 sm:text-base"
                    >
                      Loading jobs...
                    </motion.div>
                  ) : isError ? (
                    <motion.div
                      key="error"
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                      transition={{ duration: 0.2 }}
                      role="alert"
                      className="rounded-sm-card border border-line p-8 text-center text-sm text-gray-2 sm:p-10 sm:text-base"
                    >
                      Something went wrong loading jobs. Please try again shortly.
                    </motion.div>
                  ) : filteredJobs.length > 0 ? (
                    <motion.ul
                      key="job-list"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      transition={{ duration: 0.25 }}
                      className="flex flex-col gap-4"
                    >
                      {filteredJobs.map((job) => (
                        <motion.li
                          key={job.id}
                          layout="position"
                          initial={{ opacity: 0, y: 6 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ duration: 0.2 }}
                          className="min-w-0"
                        >
                          <JobRow job={job} />
                        </motion.li>
                      ))}
                    </motion.ul>
                  ) : (
                    <motion.div
                      key="empty"
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                      transition={{ duration: 0.2 }}
                      className="rounded-sm-card border border-line p-8 text-center text-sm sm:p-10 sm:text-base"
                    >
                      No roles match your search or filter criteria.
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              {/* Responsive Pagination Controls */}
              {!isPending && !isError && totalPages > 1 && (
                <nav
                  aria-label="Job list pagination"
                  className="mt-8 flex flex-wrap items-center justify-center gap-2 sm:gap-3"
                >
                  <button
                    type="button"
                    disabled={currentPage <= 1}
                    onClick={() => handlePageChange(currentPage - 1)}
                    className="inline-flex size-9 items-center justify-center rounded-lg border border-line bg-white text-ink transition-colors hover:bg-gray-3 disabled:cursor-not-allowed disabled:opacity-40 sm:size-10"
                    aria-label="Previous page"
                  >
                    <ChevronLeft className="size-4 sm:size-5" aria-hidden="true" />
                  </button>

                  <div className="hidden flex-wrap items-center gap-1.5 sm:flex">
                    {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => {
                      const isCurrent = currentPage === page;
                      return (
                        <button
                          key={page}
                          type="button"
                          onClick={() => handlePageChange(page)}
                          aria-label={`Page ${page}`}
                          aria-current={isCurrent ? "page" : undefined}
                          className={`inline-flex size-10 items-center justify-center rounded-lg text-sm font-semibold transition-colors ${
                            isCurrent
                              ? "bg-ink text-white"
                              : "border border-line bg-white text-ink hover:bg-gray-3"
                          }`}
                        >
                          {page}
                        </button>
                      );
                    })}
                  </div>

                  <span className="px-2 text-xs font-semibold text-ink sm:hidden">
                    Page {currentPage} of {totalPages}
                  </span>

                  <button
                    type="button"
                    disabled={currentPage >= totalPages}
                    onClick={() => handlePageChange(currentPage + 1)}
                    className="inline-flex size-9 items-center justify-center rounded-lg border border-line bg-white text-ink transition-colors hover:bg-gray-3 disabled:cursor-not-allowed disabled:opacity-40 sm:size-10"
                    aria-label="Next page"
                  >
                    <ChevronRight className="size-4 sm:size-5" aria-hidden="true" />
                  </button>
                </nav>
              )}
            </div>
          </div>
        </div>
      </RevealSection>
    </div>
  );
}