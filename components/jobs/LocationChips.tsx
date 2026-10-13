"use client";

import { useId } from "react";
import { motion } from "framer-motion";
import { MapPin } from "lucide-react";
import { snappySpring } from "@/lib/motion";
import { cn } from "@/lib/utils";
import type { CityOption } from "@/types/job";
import { useJobsQuery } from "./JobsQueryProvider";

/**
 * Location filter (`?location=<city-slug>`): one chip per city with published
 * jobs, each with its count, and a pill that slides to the active one.
 */
export default function LocationChips({
  cities,
  className,
}: {
  cities: CityOption[];
  className?: string;
}) {
  const { location, setLocation } = useJobsQuery();
  const pillId = useId();

  // Every job has exactly one city, so the city counts add up to "All".
  const total = cities.reduce((sum, city) => sum + city.count, 0);
  const options = [{ name: "All", slug: "", count: total }, ...cities];
  // A city from the URL with no published jobs isn't listed; keep it visible
  // so the filter shows what is actually being applied.
  if (location && !cities.some((city) => city.slug === location)) {
    options.push({ name: location, slug: location, count: 0 });
  }

  return (
    <div
      className={cn(
        "flex min-w-0 items-center rounded-full bg-gray-3 p-1.5",
        className
      )}
    >
      <MapPin className="mx-2.5 size-4 flex-none text-gray-2" aria-hidden="true" />
      <div
        role="group"
        aria-label="Filter by location"
        className="flex min-w-0 gap-1 overflow-x-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
      >
        {options.map((option) => {
          const isActive = option.slug === location;
          const isEmpty = option.count === 0 && !isActive;
          return (
            <motion.button
              key={option.slug || "all"}
              type="button"
              aria-pressed={isActive}
              disabled={isEmpty}
              onClick={() => setLocation(option.slug)}
              whileTap={isEmpty ? undefined : { scale: 0.97 }}
              className={cn(
                "relative flex flex-none items-center gap-2 rounded-full py-2 pr-2 pl-4 text-sm font-semibold transition-colors",
                isActive ? "text-white" : "text-ink hover:text-primary-dark",
                isEmpty && "cursor-not-allowed opacity-40 hover:text-ink"
              )}
            >
              {isActive && (
                <motion.span
                  layoutId={pillId}
                  className="absolute inset-0 rounded-full bg-ink shadow-sm"
                  transition={snappySpring}
                />
              )}
              <span className="relative">{option.name}</span>
              <span
                className={cn(
                  "relative min-w-6 rounded-full px-1.5 py-0.5 text-center text-xs tabular-nums transition-colors",
                  isActive ? "bg-white/15 text-white" : "bg-white text-gray-2"
                )}
              >
                {option.count}
              </span>
            </motion.button>
          );
        })}
      </div>
    </div>
  );
}
