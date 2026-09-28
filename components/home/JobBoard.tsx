"use client";

import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import FadeUp from "@/components/motion/FadeUp";
import RevealSection from "@/components/motion/RevealSection";
import JobFilterTabs from "@/components/home/JobFilterTabs";
import JobRow from "@/components/home/JobRow";
import CtaButton from "@/components/ui/CtaButton";
import SectionHeader from "@/components/ui/SectionHeader";
import { JOB_FILTERS } from "@/lib/home/data";
import { matchesFilter } from "@/lib/home/jobs";
import type { JobFilter } from "@/lib/home/types";
import { fadeUp } from "@/lib/motion";

interface JobBoardProps {
  initialJobs: any[];
}

export default function JobBoard({ initialJobs }: JobBoardProps) {
  const [filter, setFilter] = useState<JobFilter>("All");

  const filteredJobs = initialJobs.filter((job) => matchesFilter(job, filter));
  const latestTenJobs = filteredJobs.slice(0, 10);

  return (
    <RevealSection id="jobs" className="section-spacing">
      <div className="container-site">
        <div className="flex flex-col gap-2 lg:flex-row lg:items-end lg:justify-between">
          <SectionHeader
            eyebrow="Featured jobs"
            title="Hand-picked roles, updated daily"
            description="Every listing shows pay, schedule and experience up front."
          />
          <JobFilterTabs 
  filters={JOB_FILTERS as JobFilter[]} 
  active={filter} 
  onChange={setFilter} 
/>
        </div>

        <motion.ul variants={fadeUp} layout className="flex flex-col gap-4 mt-8">
          <AnimatePresence mode="popLayout" initial={false}>
            {latestTenJobs.length > 0 ? (
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
                No roles match this filter yet.
              </motion.li>
            )}
          </AnimatePresence>
        </motion.ul>

        <FadeUp className="mt-10 flex justify-center">
          <CtaButton href="/jobs">View all {filteredJobs.length} jobs</CtaButton>
        </FadeUp>
      </div>
    </RevealSection>
  );
}