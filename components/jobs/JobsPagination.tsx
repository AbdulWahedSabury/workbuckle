"use client";

import type { MouseEvent, ReactNode } from "react";
import Link from "next/link";
import { ChevronLeft, ChevronRight } from "lucide-react";

import { getPageItems } from "@/lib/jobs/pagination";
import { cn } from "@/lib/utils";
import { useJobsQuery } from "./JobsQueryProvider";

export interface JobsPaginationProps {
  /** The server's (clamped) current page. */
  page: number;
  pageCount: number;
}

const navButtonClass =
  "inline-flex size-9 items-center justify-center rounded-lg border border-line bg-white text-ink transition-colors hover:bg-gray-3 sm:size-10";

/** Page-number links (`?page=`) for the jobs feed. Renders nothing for a single page. */
export default function JobsPagination({ page: serverPage, pageCount }: JobsPaginationProps) {
  const { page: requested, isPending, setPage, hrefForPage } = useJobsQuery();
  if (pageCount <= 1) return null;

  // While a page change is loading, highlight where we're going, not where we were.
  const currentPage = isPending ? Math.min(requested, pageCount) : serverPage;

  return (
    <nav
      aria-label="Job list pagination"
      className="mt-8 flex flex-wrap items-center justify-center gap-2 sm:gap-3"
    >
      <PageLink
        page={currentPage - 1}
        href={hrefForPage(currentPage - 1)}
        disabled={currentPage <= 1}
        onNavigate={setPage}
        label="Previous page"
        className={navButtonClass}
      >
        <ChevronLeft className="size-4 sm:size-5" aria-hidden="true" />
      </PageLink>

      <div className="hidden items-center gap-1.5 sm:flex">
        {getPageItems(currentPage, pageCount).map((item, i) =>
          item === "gap" ? (
            <span key={`gap-${i}`} className="px-1 text-sm text-gray-2" aria-hidden="true">
              …
            </span>
          ) : (
            <PageLink
              key={item}
              page={item}
              href={hrefForPage(item)}
              current={currentPage === item}
              onNavigate={setPage}
              label={`Page ${item}`}
              className={cn(
                "inline-flex size-10 items-center justify-center rounded-lg text-sm font-semibold transition-colors",
                currentPage === item
                  ? "bg-ink text-white"
                  : "border border-line bg-white text-ink hover:bg-gray-3"
              )}
            >
              {item}
            </PageLink>
          )
        )}
      </div>

      <span className="px-2 text-xs font-semibold text-ink sm:hidden">
        Page {currentPage} of {pageCount}
      </span>

      <PageLink
        page={currentPage + 1}
        href={hrefForPage(currentPage + 1)}
        disabled={currentPage >= pageCount}
        onNavigate={setPage}
        label="Next page"
        className={navButtonClass}
      >
        <ChevronRight className="size-4 sm:size-5" aria-hidden="true" />
      </PageLink>
    </nav>
  );
}

function PageLink({
  page,
  href,
  label,
  className,
  current = false,
  disabled = false,
  onNavigate,
  children,
}: {
  page: number;
  href: string;
  label: string;
  className: string;
  current?: boolean;
  disabled?: boolean;
  onNavigate: (page: number) => void;
  children: ReactNode;
}) {
  if (disabled) {
    return (
      <span aria-disabled="true" aria-label={label} className={cn(className, "cursor-not-allowed opacity-40")}>
        {children}
      </span>
    );
  }

  function handleClick(e: MouseEvent<HTMLAnchorElement>) {
    // Let the browser handle new-tab/new-window clicks; take over plain ones
    // so the change runs through the shared transition.
    if (e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
    e.preventDefault();
    if (!current) onNavigate(page);
  }

  return (
    <Link
      href={href}
      onClick={handleClick}
      aria-label={label}
      aria-current={current ? "page" : undefined}
      prefetch={false}
      className={className}
    >
      {children}
    </Link>
  );
}
