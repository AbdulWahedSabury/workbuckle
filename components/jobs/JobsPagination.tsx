"use client";

import { ChevronLeft, ChevronRight } from "lucide-react";

import { getPageItems } from "@/lib/jobs/pagination";

export interface JobsPaginationProps {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
}

const navButtonClass =
  "inline-flex size-9 items-center justify-center rounded-lg border border-line bg-white text-ink transition-colors hover:bg-gray-3 disabled:cursor-not-allowed disabled:opacity-40 sm:size-10";

/** Page-number navigation for the jobs feed. Renders nothing for a single page. */
export default function JobsPagination({
  currentPage,
  totalPages,
  onPageChange,
}: JobsPaginationProps) {
  if (totalPages <= 1) return null;

  return (
    <nav
      aria-label="Job list pagination"
      className="mt-8 flex flex-wrap items-center justify-center gap-2 sm:gap-3"
    >
      <button
        type="button"
        disabled={currentPage <= 1}
        onClick={() => onPageChange(currentPage - 1)}
        className={navButtonClass}
        aria-label="Previous page"
      >
        <ChevronLeft className="size-4 sm:size-5" aria-hidden="true" />
      </button>

      <div className="hidden items-center gap-1.5 sm:flex">
        {getPageItems(currentPage, totalPages).map((item, i) =>
          item === "gap" ? (
            <span key={`gap-${i}`} className="px-1 text-sm text-gray-2" aria-hidden="true">
              …
            </span>
          ) : (
            <button
              key={item}
              type="button"
              onClick={() => onPageChange(item)}
              aria-label={`Page ${item}`}
              aria-current={currentPage === item ? "page" : undefined}
              className={`inline-flex size-10 items-center justify-center rounded-lg text-sm font-semibold transition-colors ${
                currentPage === item
                  ? "bg-ink text-white"
                  : "border border-line bg-white text-ink hover:bg-gray-3"
              }`}
            >
              {item}
            </button>
          )
        )}
      </div>

      <span className="px-2 text-xs font-semibold text-ink sm:hidden">
        Page {currentPage} of {totalPages}
      </span>

      <button
        type="button"
        disabled={currentPage >= totalPages}
        onClick={() => onPageChange(currentPage + 1)}
        className={navButtonClass}
        aria-label="Next page"
      >
        <ChevronRight className="size-4 sm:size-5" aria-hidden="true" />
      </button>
    </nav>
  );
}
