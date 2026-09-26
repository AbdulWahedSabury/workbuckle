"use client";

import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import FadeUp from "@/components/motion/FadeUp";
import RevealSection from "@/components/motion/RevealSection";
import JobFilterTabs from "@/components/home/JobFilterTabs";
import JobRow from "@/components/home/JobRow";
import CtaButton from "@/components/ui/CtaButton";
import SectionHeader from "@/components/ui/SectionHeader";
import { JOB_FILTERS, JOBS } from "@/lib/home/data";
import { matchesFilter } from "@/lib/home/jobs";
import type { JobFilter } from "@/lib/home/types";
import { fadeUp } from "@/lib/motion";

export default function JobBoard() {
  const [filter, setFilter] = useState<JobFilter>("All");
  const jobs = JOBS.filter((job) => matchesFilter(job, filter));

  return (
    <RevealSection id="jobs" className="section-spacing">
      <div className="container-site">
        <div className="flex flex-col gap-2 lg:flex-row lg:items-end lg:justify-between">
          <SectionHeader
            eyebrow="Featured jobs"
            title="Hand-picked roles, updated daily"
            description="Every listing shows pay, schedule and experience up front."
          />
          <JobFilterTabs filters={JOB_FILTERS} active={filter} onChange={setFilter} />
        </div>

        <motion.ul variants={fadeUp} layout className="flex flex-col gap-4">
          <AnimatePresence mode="popLayout" initial={false}>
            {jobs.map((job) => (
              <JobRow key={job.id} job={job} />
            ))}
          </AnimatePresence>
          {jobs.length === 0 && (
            <li className="rounded-sm-card border border-line p-10 text-center">No roles match this filter yet.</li>
          )}
        </motion.ul>

        <FadeUp className="mt-10 flex justify-center">
          <CtaButton href="#">View all {JOBS.length * 200}+ jobs</CtaButton>
        </FadeUp>
      </div>
    </RevealSection>
  );
}
