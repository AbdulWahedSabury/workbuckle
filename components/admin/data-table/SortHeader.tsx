"use client";

import { ArrowDown, ArrowUp, ChevronsUpDown } from "lucide-react";
import { cn } from "@/lib/utils";
import { useColumnSort, useListQuery } from "./ListQueryProvider";
import { alignClass, type ColumnAlign } from "./types";

const ARIA_SORT = { asc: "ascending", desc: "descending" } as const;
const NEXT_LABEL = { none: "ascending", asc: "descending", desc: "default order" };

/** A <th> whose button cycles the column's sort: none → asc → desc → none. */
export default function SortHeader({
  label,
  sortKey,
  align = "left",
  className,
}: {
  label: string;
  sortKey: string;
  align?: ColumnAlign;
  className?: string;
}) {
  const { toggleSort } = useListQuery();
  const dir = useColumnSort(sortKey);
  const Icon = dir === "asc" ? ArrowUp : dir === "desc" ? ArrowDown : ChevronsUpDown;

  return (
    <th
      scope="col"
      aria-sort={dir ? ARIA_SORT[dir] : "none"}
      className={cn("px-2 py-2", alignClass[align], className)}
    >
      <button
        type="button"
        onClick={() => toggleSort(sortKey)}
        title={`Sort by ${label}: ${NEXT_LABEL[dir ?? "none"]}`}
        className={cn(
          "group/sort inline-flex items-center gap-1.5 rounded-full px-2 py-1 text-xs font-semibold tracking-wide uppercase transition-colors focus-visible:ring-2 focus-visible:ring-primary focus-visible:outline-none",
          align === "right" && "flex-row-reverse",
          dir ? "text-ink" : "text-gray-2 hover:bg-white hover:text-ink"
        )}
      >
        {label}
        <span
          aria-hidden="true"
          className={cn(
            "flex size-5 items-center justify-center rounded-full transition-colors",
            dir ? "bg-primary text-on-primary" : "text-gray-2/60 group-hover/sort:text-ink"
          )}
        >
          <Icon className="size-3.5" strokeWidth={2.5} />
        </span>
      </button>
    </th>
  );
}
