"use client";

import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { useLocale, useTranslations } from "next-intl";
import { useQuery } from "@tanstack/react-query";
import FadeUp from "@/components/motion/FadeUp";
import RevealSection from "@/components/motion/RevealSection";
import JobFilterTabs from "@/components/jobs/JobFilterTabs";
import JobRow from "@/components/jobs/JobRow";
import CtaButton from "@/components/ui/CtaButton";
import SectionHeader from "@/components/ui/SectionHeader";
import { fadeUp } from "@/lib/motion";

import { useSearchQueryParam } from "@/hooks/use-search-query-params";
import { JOBS_QUERY_KEY } from "@/constants/query-keys";
import { fetchJobs } from "@/queries/job";
import { JobFilter, matchesFilter } from "@/types/job";
import { JobsLoadingState } from "./JobsLoadingState";
import { JobsEmptyState } from "./JobsEmptyState";
import { JOB_FILTERS } from "@/constants/job_filters";

const STALE_TIME = 1000 * 60 * 60; // 1 hour
const GC_TIME = 1000 * 60 * 60 * 2; // 2 hours

export default function JobBoard() {
  const t = useTranslations("pages.home.featured_jobs");
  const locale = useLocale();

  const { query } = useSearchQueryParam({
    search: "",
    sort: "",
    locale,
  });
  const { data, isPending } = useQuery({
    queryKey: [JOBS_QUERY_KEY, query],
    queryFn: () => fetchJobs(query),
    staleTime: STALE_TIME,
    gcTime: GC_TIME,
  });

  const apiJobs = data?.results ?? [];
  const [filter, setFilter] = useState<JobFilter>("All");
  const filteredJobs = apiJobs.filter((job) => matchesFilter(job, filter));
  const latestTenJobs = filteredJobs.slice(0, 10);


  return (
    <RevealSection id="jobs" className="section-spacing">
      <div className="container-site">
        <div className="flex flex-col gap-2 lg:flex-row lg:items-end lg:justify-between">
          <SectionHeader
            eyebrow={t("eyebrow")}
            title={t("title")}
            description=""
          />

          <JobFilterTabs
            filters={JOB_FILTERS}
            active={filter}
            onChange={setFilter}
          />
        </div>

        <motion.ul
          variants={fadeUp}
          layout
          className="mt-8 flex flex-col gap-4"
        >
          <AnimatePresence mode="popLayout" initial={false}>
            {isPending ? (
              <motion.li
                key="loading"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="list-none w-full"
              >
                <JobsLoadingState />
              </motion.li>
            ) : latestTenJobs.length > 0 ? (
              latestTenJobs.map((job) => (
                <motion.li
                  key={job.id}
                  layout
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  transition={{ duration: 0.2 }}
                >
                  <JobRow job={job} />
                </motion.li>
              ))
            ) : (
              <motion.li
                key="empty"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="rounded-sm-card border border-line p-10 text-center list-none"
              >
                <JobsEmptyState 
                  filterName={filter} 
                />
              </motion.li>
            )}
          </AnimatePresence>
        </motion.ul>

        <FadeUp className="mt-10 flex justify-center">
          <CtaButton href={`/jobs`}>
            View all {filteredJobs.length} jobs
          </CtaButton>
        </FadeUp>
      </div>
    </RevealSection>
  );
}
