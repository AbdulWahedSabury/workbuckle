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
  // 1. FIXED: Set the initial state back to a value found in your JOB_FILTERS array (e.g., "All" or "Full-Time")
  const [filter, setFilter] = useState<JobFilter>("All");

  // 2. FIXED: Filter the list first, then slice it to grab only the 10 latest roles
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
          {/* Active filter prop will now correctly highlight the tab styling */}
          <JobFilterTabs filters={JOB_FILTERS} active={filter} onChange={setFilter} />
        </div>

        <motion.ul variants={fadeUp} layout className="flex flex-col gap-4">
          <AnimatePresence mode="popLayout" initial={false}>
            {latestTenJobs.map((job) => (
              <JobRow key={job.id} job={job} />
            ))}
          </AnimatePresence>
          {latestTenJobs.length === 0 && (
            <li className="rounded-sm-card border border-line p-10 text-center">
              No roles match this filter yet.
            </li>
          )}
        </motion.ul>

        <FadeUp className="mt-10 flex justify-center">
          {/* Displays the total count of filtered opportunities available */}
          <CtaButton href="/jobs">View all {filteredJobs.length} jobs</CtaButton>
        </FadeUp>
      </div>
    </RevealSection>
  );
}
