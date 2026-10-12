"use client";

import { motion } from "framer-motion";
import { ArrowUpRight, Banknote, Clock, GraduationCap, MapPin, Building2 } from "lucide-react";
import { MotionLink } from "@/components/motion/MotionLink";
import { jobTypeKey } from "@/lib/jobs/job-type";
import { snappySpring, spring } from "@/lib/motion";
import type { PublicJobSummary } from "@/types/job";

// Keyed by jobTypeKey(slug); other job types use the default.
const SCHEDULE_STYLES: Record<string, string> = {
  full_time: "bg-ink text-white",
  part_time: "bg-primary/15 text-primary-dark",
  internship: "bg-emerald-100 text-emerald-800",
};
const DEFAULT_SCHEDULE_STYLE = "bg-ink text-white";

const chipClass = "flex items-center gap-1.5 rounded-full bg-gray-3 px-3 py-1.5 text-ink";

interface JobRowProps {
  job: PublicJobSummary;
}

export default function JobRow({ job }: JobRowProps) {

  return (
    <div className="w-full">
      <MotionLink
        href={`/jobs/${job.id}`}
        initial="rest"
        animate="rest"
        whileHover="hover"
        whileFocus="hover"
        whileTap={{ scale: 0.98 }}
        variants={{
          rest: { scale: 1, backgroundColor: "#ffffff" },
          hover: { scale: 1.015, backgroundColor: "#fff7f1" },
        }}
        transition={spring}
        className="flex flex-col gap-5 rounded-sm-card border border-line p-5 sm:p-6 lg:flex-row lg:items-center lg:gap-8"
      >
        <div className="flex items-center gap-4 lg:w-[38%]">
          <span className="flex size-14 flex-none items-center justify-center rounded-2xl border border-line bg-white text-gray-400">
            <Building2 className="size-6" />
          </span>
          <div className="min-w-0">
            <h3 className="truncate text-lg sm:text-xl font-bold">{job.title}</h3>
            <p className="truncate text-sm text-gray-500">{job.category}</p>
          </div>
        </div>

        <ul className="flex flex-1 flex-wrap gap-2 text-sm font-semibold" aria-label="Job details">
          <li className={`rounded-full px-3 py-1.5 ${SCHEDULE_STYLES[jobTypeKey(job.jobTypeSlug)] ?? DEFAULT_SCHEDULE_STYLE}`}>
            {job.jobType}
          </li>
          <li className={chipClass}>
            <MapPin className="size-4" aria-hidden="true" /> {job.city}
          </li>
          <li className={chipClass}>
            <Banknote className="size-4" aria-hidden="true" /> {job.salary}
          </li>
          <li className={chipClass}>
            <GraduationCap className="size-4" aria-hidden="true" /> {job.experience}
          </li>
        </ul>

        <div className="flex items-center justify-between gap-4 lg:justify-end">
          <span className="flex items-center gap-1.5 text-sm lg:hidden text-gray-400">
            <Clock className="size-4" /> Active
          </span>
          <span className="flex items-center gap-2 font-semibold text-ink">
            Apply
            <motion.span
              variants={{ rest: { x: 0, y: 0, rotate: 0 }, hover: { x: 4, y: -4, rotate: 0 } }}
              transition={snappySpring}
              className="flex size-10 items-center justify-center rounded-full bg-primary text-ink"
            >
              <ArrowUpRight className="size-5" />
            </motion.span>
          </span>
        </div>
      </MotionLink>
    </div>
  );
}