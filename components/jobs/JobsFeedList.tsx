"use client";

import { AnimatePresence, motion } from "framer-motion";

import JobRow from "@/components/jobs/JobRow";
import { JobsEmptyState } from "@/components/jobs/JobsEmptyState";
import type { PublicJobSummary } from "@/types/job";
import { useJobsQuery } from "./JobsQueryProvider";

export interface JobsFeedListProps {
  jobs: PublicJobSummary[];
  isError?: boolean;
}

/**
 * Animated job list with error and empty states. While a new query loads the
 * current rows stay up, dimmed, until the server sends the next ones.
 */
export default function JobsFeedList({ jobs, isError = false }: JobsFeedListProps) {
  const { isPending, hasFilters, clearFilters } = useJobsQuery();

  return (
    <motion.ul
      layout
      aria-busy={isPending}
      className={`mt-8 flex flex-col gap-4 transition-opacity duration-300 ${
        isPending ? "pointer-events-none opacity-60" : "opacity-100"
      }`}
    >
      <AnimatePresence mode="popLayout" initial={false}>
        {isError ? (
          <motion.li
            key="error"
            role="alert"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="list-none rounded-sm-card border border-line p-10 text-center text-gray-2"
          >
            Something went wrong loading jobs. Please try again shortly.
          </motion.li>
        ) : jobs.length > 0 ? (
          jobs.map((job) => (
            <motion.li
              key={job.id}
              layout
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2 }}
              className="min-w-0"
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
            className="list-none"
          >
            <JobsEmptyState onClear={hasFilters ? clearFilters : undefined} />
          </motion.li>
        )}
      </AnimatePresence>
    </motion.ul>
  );
}
