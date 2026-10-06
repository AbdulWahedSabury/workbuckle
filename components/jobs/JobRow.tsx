"use client";

import { motion } from "framer-motion";
import { ArrowUpRight, Banknote, Clock, GraduationCap, MapPin, Building2 } from "lucide-react";
import { MotionLink } from "@/components/motion/MotionLink";
import { snappySpring, spring } from "@/lib/motion";
import { JobDetailsResponse } from "@/types/job";

// 1. Updated mapping keys to match Manatal's "contract_details" options
const SCHEDULE_STYLES: Record<string, string> = {
  "full_time": "bg-ink text-white",
  "part_time": "bg-primary/15 text-primary-dark",
  "internship": "bg-emerald-100 text-emerald-800",
};

// Helper utility to convert snake_case contract details to readable tags
const formatSchedule = (slug: string) => {
  if (!slug) return "Full-Time";
  return slug
    .split("_")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join("-");
};

interface JobRowProps {
  job:JobDetailsResponse;
}
export default function JobRow({ job }: JobRowProps) {
  const displayLocation = job.city || "Larnaca"; 
  const displayScheduleTag = job.contract_details || "full_time";
  const displayScheduleLabel = formatSchedule(displayScheduleTag);
  
  const displaySalary = "€1,500 Gross (Neg.)";
  const displayExperience = "1-3 years exp.";

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
            <h3 className="truncate text-lg sm:text-xl font-bold">{job.position_name}</h3>
            <p className="text-sm text-gray-500">
              Mavromatis Employment Bureau
            </p>
          </div>
        </div>

        <ul className="flex flex-1 flex-wrap gap-2 text-sm font-semibold" aria-label="Job details">
          <li className={`rounded-full px-3 py-1.5 ${SCHEDULE_STYLES[displayScheduleTag] || "bg-ink text-white"}`}>
            {displayScheduleLabel}
          </li>
          <li className="flex items-center gap-1.5 rounded-full bg-gray-3 px-3 py-1.5 text-ink">
            <MapPin className="size-4" /> {displayLocation}
            {job.is_remote && <span className="text-gray-2">· Remote </span>}
          </li>
          {/* <li className="flex items-center gap-1.5 rounded-full bg-gray-3 px-3 py-1.5 text-ink">
            <Banknote className="size-4" /> {displaySalary}
          </li>
          <li className="flex items-center gap-1.5 rounded-full bg-gray-3 px-3 py-1.5 text-ink">
            <GraduationCap className="size-4" /> {displayExperience}
          </li> */}
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