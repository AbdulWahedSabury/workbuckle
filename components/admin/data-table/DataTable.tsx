import type { ReactNode } from "react";
import { cn } from "@/lib/utils";
import type { PageInfo } from "@/lib/admin/list-params";
import Pagination from "./Pagination";
import SortHeader from "./SortHeader";
import { alignClass, hideBelowClass, type Column } from "./types";

type DataTableProps<T, K extends string> = {
  columns: readonly Column<T, K>[];
  rows: readonly T[];
  getRowKey: (row: T) => string;
  /** Describes the table for screen readers; not shown. */
  caption: string;
  /** Rendered instead of the table when `rows` is empty. */
  empty?: ReactNode;
  /** Adds a pagination footer for this slice of a larger result. */
  pagination?: PageInfo & { itemLabel?: string };
};

/**
 * Configuration-driven table. Renders on the server (cells are functions, which
 * can't cross to the client); only sortable headers and the pagination footer
 * hydrate. Both need a <ListQueryProvider> above the table (see <ListView>).
 */
export default function DataTable<T, K extends string = string>({
  columns,
  rows,
  getRowKey,
  caption,
  empty,
  pagination,
}: DataTableProps<T, K>) {
  if (rows.length === 0 && empty) return <>{empty}</>;

  return (
    <div className="overflow-hidden rounded-sm-card border border-line bg-white">
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <caption className="sr-only">{caption}</caption>
          <thead className="border-b border-line bg-gray-3/60">
            <tr>
              {columns.map((column) => {
                const responsive = column.hideBelow && hideBelowClass[column.hideBelow];
                return column.sortKey ? (
                  <SortHeader
                    key={column.id}
                    label={column.header}
                    sortKey={column.sortKey}
                    align={column.align}
                    className={responsive}
                  />
                ) : (
                  <th
                    key={column.id}
                    scope="col"
                    className={cn(
                      "px-4 py-3 text-xs font-semibold tracking-wide whitespace-nowrap text-gray-2 uppercase",
                      alignClass[column.align ?? "left"],
                      responsive
                    )}
                  >
                    {column.hideHeader ? (
                      <span className="sr-only">{column.header}</span>
                    ) : (
                      column.header
                    )}
                  </th>
                );
              })}
            </tr>
          </thead>
          <tbody className="divide-y divide-line">
            {rows.map((row) => (
              <tr
                key={getRowKey(row)}
                className="transition-colors duration-150 hover:bg-primary/[0.035]"
              >
                {columns.map((column) => (
                  <td
                    key={column.id}
                    className={cn(
                      "px-4 py-3.5 align-middle text-gray-2",
                      alignClass[column.align ?? "left"],
                      column.hideBelow && hideBelowClass[column.hideBelow],
                      column.className
                    )}
                  >
                    {column.cell(row)}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {pagination && <Pagination info={pagination} label={pagination.itemLabel} />}
    </div>
  );
}
