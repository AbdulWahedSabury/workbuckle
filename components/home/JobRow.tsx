"use client";

import Image from "next/image";
import { motion } from "framer-motion";
import { ArrowUpRight, Banknote, Clock, GraduationCap, MapPin } from "lucide-react";
import { MotionLink } from "@/components/motion/MotionLink";
import type { Job, Schedule } from "@/lib/home/types";
import { snappySpring, spring } from "@/lib/motion";

const SCHEDULE_STYLES: Record<Schedule, string> = {
  "Full-Time": "bg-ink text-white",
  "Part-Time": "bg-primary/15 text-primary-dark",
  Internship: "bg-emerald-100 text-emerald-800",
};

interface JobRowProps {
  job: Job;
}

export default function JobRow({ job }: JobRowProps) {
  return (
    <motion.li
      layout
      initial={{ opacity: 0, y: 30 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.96, transition: { duration: 0.2 } }}
      transition={spring}
    >
      <MotionLink
        href="#"
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
          <span className="flex size-14 flex-none items-center justify-center rounded-2xl border border-line bg-white">
            <Image
              src={job.logo}
              alt={`${job.company} company logo (square, ~80×80)`}
              width={36}
              height={36}
              className="size-9 rounded-lg object-contain"
            />
          </span>
          <div className="min-w-0">
            <h3 className="truncate text-lg sm:text-xl">{job.title}</h3>
            <p className="text-sm">
              {job.company} · {job.posted}
            </p>
          </div>
        </div>

        <ul className="flex flex-1 flex-wrap gap-2 text-sm font-semibold" aria-label="Job details">
          <li className={`rounded-full px-3 py-1.5 ${SCHEDULE_STYLES[job.schedule]}`}>{job.schedule}</li>
          <li className="flex items-center gap-1.5 rounded-full bg-gray-3 px-3 py-1.5 text-ink">
            <MapPin className="size-4" /> {job.location}
            {job.remote && job.location !== "Remote" && <span className="text-gray-2">· Remote OK</span>}
          </li>
          <li className="flex items-center gap-1.5 rounded-full bg-gray-3 px-3 py-1.5 text-ink">
            <Banknote className="size-4" /> {job.salary}
          </li>
          <li className="flex items-center gap-1.5 rounded-full bg-gray-3 px-3 py-1.5 text-ink">
            <GraduationCap className="size-4" /> {job.experience}
          </li>
        </ul>

        <div className="flex items-center justify-between gap-4 lg:justify-end">
          <span className="flex items-center gap-1.5 text-sm lg:hidden">
            <Clock className="size-4" /> {job.posted}
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
    </motion.li>
  );
}
