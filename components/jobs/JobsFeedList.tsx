"use client";

import { AnimatePresence, motion } from "framer-motion";

import JobRow from "@/components/jobs/JobRow";
import { JobsLoadingState } from "@/components/jobs/JobsLoadingState";
import { JobsEmptyState } from "@/components/jobs/JobsEmptyState";
import { JobDetailsResponse, JobFilter } from "@/types/job";

export interface JobsFeedListProps {
  jobs: JobDetailsResponse[];
  filter: JobFilter;
  isPending: boolean;
  isError: boolean;
  isFetching: boolean;
}

/** Animated job list with loading, error, and empty states. */
export default function JobsFeedList({
  jobs,
  filter,
  isPending,
  isError,
  isFetching,
}: JobsFeedListProps) {
  return (
    <motion.ul
      layout
      aria-busy={isFetching}
      className={`mt-8 flex flex-col gap-4 transition-opacity duration-300 ${
        isFetching && !isPending ? "opacity-60" : "opacity-100"
      }`}
    >
      <AnimatePresence mode="popLayout" initial={false}>
        {isPending ? (
          <motion.li
            key="loading"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="w-full list-none"
          >
            <JobsLoadingState />
          </motion.li>
        ) : isError ? (
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
            className="list-none rounded-sm-card border border-line p-10 text-center"
          >
            <JobsEmptyState filterName={filter} />
          </motion.li>
        )}
      </AnimatePresence>
    </motion.ul>
  );
}
