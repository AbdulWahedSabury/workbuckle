import type { ReactNode } from "react";

export type ColumnAlign = "left" | "center" | "right";

/** Breakpoint below which a column is hidden, to keep narrow screens readable. */
export type ColumnBreakpoint = "sm" | "md" | "lg";

/**
 * One column of a <DataTable>. `T` is the row type; `K` is the union of sort
 * keys the list's query accepts, so a column can't advertise a sort the server
 * would ignore.
 */
export type Column<T, K extends string = string> = {
  id: string;
  header: string;
  /** Visually hide the header text (e.g. an actions column). */
  hideHeader?: boolean;
  /** Makes the header a sort toggle that writes `?sort=<sortKey>`. */
  sortKey?: K;
  cell: (row: T) => ReactNode;
  align?: ColumnAlign;
  hideBelow?: ColumnBreakpoint;
  /** Extra classes for this column's cells, e.g. a width. */
  className?: string;
};

export const alignClass: Record<ColumnAlign, string> = {
  left: "text-left",
  center: "text-center",
  right: "text-right",
};

export const hideBelowClass: Record<ColumnBreakpoint, string> = {
  sm: "hidden sm:table-cell",
  md: "hidden md:table-cell",
  lg: "hidden lg:table-cell",
};
