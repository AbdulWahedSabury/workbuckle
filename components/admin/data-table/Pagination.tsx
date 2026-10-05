"use client";

import { useId, type MouseEvent, type ReactNode } from "react";
import Link from "next/link";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";
import { PAGE_SIZES, pageRange, type PageInfo, type PageSize } from "@/lib/admin/list-params";
import { useListQuery } from "./ListQueryProvider";

const numberFormat = new Intl.NumberFormat("en");

const itemBase =
  "inline-flex h-9 min-w-9 items-center justify-center rounded-full px-3 text-sm font-semibold tabular-nums transition-[background-color,color,transform] duration-200 focus-visible:ring-2 focus-visible:ring-primary focus-visible:outline-none";

/**
 * Footer for a paginated list: "Showing 21–40 of 132", a page-size picker and
 * page links. `info` is the server's (clamped) view of the current page.
 */
export default function Pagination({ info, label = "rows" }: { info: PageInfo; label?: string }) {
  const { page: requested, pageSize, isPending, setPage, setPageSize, hrefForPage } =
    useListQuery();
  const sizeId = useId();
  const { pageCount, total } = info;

  // While a page change is loading, highlight where we're going, not where we were.
  const page = isPending ? Math.min(requested, pageCount) : info.page;
  const from = total === 0 ? 0 : (info.page - 1) * info.pageSize + 1;
  const to = Math.min(info.page * info.pageSize, total);

  return (
    <div className="flex flex-col gap-3 border-t border-line px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
      <div className="flex flex-wrap items-center gap-x-5 gap-y-2 text-sm text-gray-2">
        <p aria-live="polite">
          Showing <span className="font-semibold text-ink tabular-nums">{from}–{to}</span> of{" "}
          <span className="font-semibold text-ink tabular-nums">{numberFormat.format(total)}</span>{" "}
          {label}
        </p>
        {total > PAGE_SIZES[0] && (
          <div className="flex items-center gap-2">
            <label htmlFor={sizeId}>Per page</label>
            <select
              id={sizeId}
              value={pageSize}
              onChange={(e) => setPageSize(Number(e.target.value) as PageSize)}
              className="h-8 cursor-pointer rounded-full border border-line bg-white pr-2 pl-3 text-sm font-semibold text-ink transition-colors outline-none hover:border-ink/20 focus-visible:border-primary focus-visible:ring-4 focus-visible:ring-primary/15"
            >
              {PAGE_SIZES.map((size) => (
                <option key={size} value={size}>
                  {size}
                </option>
              ))}
            </select>
          </div>
        )}
      </div>

      {pageCount > 1 && (
        <nav aria-label="Pagination" className="flex items-center gap-1 self-end sm:self-auto">
          <PageLink
            page={page - 1}
            disabled={page <= 1}
            href={hrefForPage(page - 1)}
            onNavigate={setPage}
            label="Previous page"
          >
            <ChevronLeft className="size-4" aria-hidden="true" />
          </PageLink>

          {/* Full page list from sm up; a compact "2 / 9" on phones. */}
          <ul className="hidden items-center gap-1 sm:flex">
            {pageRange(page, pageCount).map((item, i) =>
              item === "gap" ? (
                <li key={`gap-${i}`} aria-hidden="true" className="px-1 text-gray-2/60">
                  …
                </li>
              ) : (
                <li key={item}>
                  <PageLink
                    page={item}
                    current={item === page}
                    href={hrefForPage(item)}
                    onNavigate={setPage}
                    label={`Page ${item}`}
                  >
                    {item}
                  </PageLink>
                </li>
              )
            )}
          </ul>
          <p className="px-2 text-sm text-gray-2 tabular-nums sm:hidden">
            Page <span className="font-semibold text-ink">{page}</span> of {pageCount}
          </p>

          <PageLink
            page={page + 1}
            disabled={page >= pageCount}
            href={hrefForPage(page + 1)}
            onNavigate={setPage}
            label="Next page"
          >
            <ChevronRight className="size-4" aria-hidden="true" />
          </PageLink>
        </nav>
      )}
    </div>
  );
}

function PageLink({
  page,
  href,
  label,
  current = false,
  disabled = false,
  onNavigate,
  children,
}: {
  page: number;
  href: string;
  label: string;
  current?: boolean;
  disabled?: boolean;
  onNavigate: (page: number) => void;
  children: ReactNode;
}) {
  if (disabled) {
    return (
      <span aria-disabled="true" aria-label={label} className={cn(itemBase, "text-gray-2/40")}>
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
      className={cn(
        itemBase,
        current
          ? "bg-ink text-white"
          : "text-ink hover:bg-gray-3 active:scale-95"
      )}
    >
      {children}
    </Link>
  );
}
