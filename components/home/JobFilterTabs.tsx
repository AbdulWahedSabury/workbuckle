"use client";

import { motion } from "framer-motion";
import { fadeUp, snappySpring } from "@/lib/motion";
import { JobFilter } from "@/types/job";

interface JobFilterTabsProps {
  filters: readonly JobFilter[]; 
  active: JobFilter;
  onChange: (filter: JobFilter) => void;
}

/** Segmented control with a pill that slides to the active filter. */
export default function JobFilterTabs({ filters, active, onChange }: JobFilterTabsProps) {
  return (
    <motion.div
      variants={fadeUp}
      role="tablist"
      aria-label="Filter jobs"
      className="-mx-4 mb-8 flex gap-1 overflow-x-auto px-4 pb-1 sm:mx-0 sm:px-0 lg:mb-[50px]"
    >
      <div className="flex gap-1 rounded-full bg-gray-3 p-1.5">
        {filters.map((f) => {
          const isActive = active === f;
          return (
            <motion.button
              key={f}
              type="button"
              role="tab"
              aria-selected={isActive}
              onClick={() => onChange(f)}
              whileTap={{ scale: 0.98 }}
              className={`relative flex-none rounded-full px-4 py-2 text-sm font-semibold transition-colors ${
                isActive ? "text-white" : "text-ink hover:text-primary-dark"
              }`}
            >
              {isActive && (
                <motion.span
                  layoutId="job-filter-pill"
                  className="absolute inset-0 rounded-full bg-ink"
                  transition={snappySpring}
                />
              )}
              <span className="relative">{f}</span>
            </motion.button>
          );
        })}
      </div>
    </motion.div>
  );
}
