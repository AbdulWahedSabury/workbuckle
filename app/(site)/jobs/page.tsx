"use client";

import RevealSection from "@/components/motion/RevealSection";
import SectionHeader from "@/components/ui/SectionHeader";
import JobFilterTabs from "@/components/jobs/JobFilterTabs";
import JobsSearchHero from "@/components/jobs/JobsSearchHero";
import JobsFeedList from "@/components/jobs/JobsFeedList";
import JobsPagination from "@/components/jobs/JobsPagination";
import { JOB_FILTERS } from "@/constants/job_filters";
import { useJobsList } from "@/hooks/use-jobs-list";

export default function JobsListPage() {
  const {
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
  } = useJobsList();

  const feedTitle = isPending
    ? "Loading roles…"
    : `${roleCount} open ${roleCount === 1 ? "role" : "roles"}`;

  return (
    <div className="w-full max-w-full overflow-x-hidden">
      <JobsSearchHero
        searchValue={searchInput}
        onSearchChange={setSearchInput}
        onSearchSubmit={onSearchSubmit}
      />

      <RevealSection id="job-feed" className="section-spacing">
        <div className="container-site">
          <div className="flex flex-col gap-2 lg:flex-row lg:items-end lg:justify-between">
            <div aria-live="polite">
              <SectionHeader eyebrow="Job Feed" title={feedTitle} description="" />
            </div>

            <JobFilterTabs filters={JOB_FILTERS} active={filter} onChange={onFilterChange} />
          </div>

          <JobsFeedList
            jobs={visibleJobs}
            filter={filter}
            isPending={isPending}
            isError={isError}
            isFetching={isFetching}
          />

          {!isPending && !isError && (
            <JobsPagination
              currentPage={currentPage}
              totalPages={totalPages}
              onPageChange={onPageChange}
            />
          )}
        </div>
      </RevealSection>
    </div>
  );
}
