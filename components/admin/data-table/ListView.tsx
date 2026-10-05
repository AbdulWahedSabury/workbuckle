import { Suspense, type ReactNode } from "react";
import { ListQueryProvider, PendingRegion } from "./ListQueryProvider";
import SearchBar from "./SearchBar";
import { TableSkeleton, ToolbarSkeleton } from "./skeletons";

/**
 * Searchable, sortable list layout. Pass the async table as `children`.
 *
 * - Outer <Suspense>: the provider reads `useSearchParams`, so this boundary
 *   lets everything above it (page header, shell) render without waiting.
 * - Inner <Suspense>: streams the first load of rows behind a skeleton. Later
 *   searches/sorts run in a transition, so the old rows stay up (dimmed by
 *   <PendingRegion>) instead of flashing back to the skeleton.
 */
export default function ListView({
  searchLabel,
  searchPlaceholder,
  columnCount,
  toolbar,
  children,
}: {
  searchLabel: string;
  searchPlaceholder?: string;
  /** Column count for the loading skeleton. */
  columnCount: number;
  /** Extra controls shown to the right of the search box. */
  toolbar?: ReactNode;
  children: ReactNode;
}) {
  const tableSkeleton = <TableSkeleton columns={columnCount} />;

  return (
    <Suspense
      fallback={
        <>
          <ToolbarSkeleton />
          {tableSkeleton}
        </>
      }
    >
      <ListQueryProvider>
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
          <SearchBar label={searchLabel} placeholder={searchPlaceholder} />
          {toolbar}
        </div>
        <PendingRegion>
          <Suspense fallback={tableSkeleton}>{children}</Suspense>
        </PendingRegion>
      </ListQueryProvider>
    </Suspense>
  );
}
