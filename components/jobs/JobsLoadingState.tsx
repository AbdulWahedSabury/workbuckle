"use client";

import { motion } from "framer-motion";

export function JobsLoadingState() {
  return (
    <motion.div
      key="loading"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="flex flex-col items-center justify-center py-16 px-4 rounded-xl border border-dashed border-line bg-card/50 text-center"
    >
      {/* Animated Glowing Ring */}
      <div className="relative flex items-center justify-center w-12 h-12 mb-4">
        <span className="absolute inline-flex h-full w-full rounded-full bg-primary/20 animate-ping" />
        <span className="relative inline-flex rounded-full h-8 w-8 bg-primary/10 items-center justify-center">
          <svg
            className="animate-spin h-5 w-5 text-primary"
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
          >
            <circle
              className="opacity-25"
              cx="12"
              cy="12"
              r="10"
              stroke="currentColor"
              strokeWidth="4"
            />
            <path
              className="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
            />
          </svg>
        </span>
      </div>

      {/* Text Feedback */}
      <p className="text-base font-medium text-foreground">
        Fetching available roles...
      </p>
      <p className="text-xs text-muted-foreground mt-1">
        Gathering positions across all districts
      </p>
    </motion.div>
  );
}