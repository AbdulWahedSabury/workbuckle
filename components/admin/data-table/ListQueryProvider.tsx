"use client";

import {
  createContext,
  startTransition,
  use,
  useOptimistic,
  type ReactNode,
} from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { cn } from "@/lib/utils";
import {
  nextSort,
  readListParams,
  writeListParams,
  type ListParams,
  type PageSize,
  type SortState,
} from "@/lib/admin/list-params";

type ListQuery = ListParams & {
  /** True while the server is re-rendering the list for a new query. */
  isPending: boolean;
  setSearch: (q: string) => void;
  toggleSort: (key: string) => void;
  setPage: (page: number) => void;
  setPageSize: (size: PageSize) => void;
  /** URL for these params with `page` swapped, for real <a href>s. */
  hrefForPage: (page: number) => string;
};

const ListQueryContext = createContext<ListQuery | null>(null);

/**
 * Single owner of a list's search/sort state. The URL is the source of truth;
 * this provider reads it, writes it, and holds one transition so every
 * consumer (search box, sort headers, the table body) shares the same pending
 * state. Uses `useSearchParams`, so render it inside a <Suspense> boundary.
 */
export function ListQueryProvider({ children }: { children: ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  // Optimistic copy of the URL state: headers and the search box reflect a
  // change on the current frame instead of after the server responds, and a
  // second change made mid-navigation builds on the first.
  const [params, setOptimisticParams] = useOptimistic(
    readListParams(searchParams)
  );
  const [isPending, setIsPending] = useOptimistic(false);

  function hrefFor(next: ListParams) {
    const query = writeListParams(
      new URLSearchParams(searchParams.toString()),
      next
    ).toString();
    return query ? `${pathname}?${query}` : pathname;
  }

  // Search/sort/size use replace (no history entry per keystroke) and keep the
  // scroll position. Paging pushes, so Back returns to the previous page, and
  // scrolls up so the new rows start at the top.
  function navigate(next: ListParams, mode: "replace" | "push" = "replace") {
    startTransition(() => {
      setOptimisticParams(next);
      setIsPending(true);
      router[mode](hrefFor(next), { scroll: mode === "push" });
    });
  }

  const value: ListQuery = {
    ...params,
    isPending,
    // Anything that changes the result set starts again from page 1.
    setSearch(q) {
      const trimmed = q.trim();
      if (trimmed !== params.q) navigate({ ...params, q: trimmed, page: 1 });
    },
    toggleSort(key) {
      navigate({ ...params, sort: nextSort(params.sort, key), page: 1 });
    },
    setPage(page) {
      if (page !== params.page) navigate({ ...params, page }, "push");
    },
    setPageSize(pageSize) {
      if (pageSize !== params.pageSize) navigate({ ...params, pageSize, page: 1 });
    },
    hrefForPage: (page) => hrefFor({ ...params, page }),
  };

  return <ListQueryContext value={value}>{children}</ListQueryContext>;
}

export function useListQuery(): ListQuery {
  const context = use(ListQueryContext);
  if (!context) {
    throw new Error("useListQuery must be used inside <ListQueryProvider>.");
  }
  return context;
}

/** Sort direction for one column, or null when it isn't the active sort. */
export function useColumnSort(key: string): SortState["dir"] | null {
  const { sort } = useListQuery();
  return sort?.key === key ? sort.dir : null;
}

/**
 * Dims server-rendered content while a new query is loading, keeping the old
 * rows on screen (no skeleton flash) until the fresh ones arrive.
 */
export function PendingRegion({ children }: { children: ReactNode }) {
  const { isPending } = useListQuery();
  return (
    <div
      aria-busy={isPending}
      className={cn(
        "transition-opacity duration-200",
        isPending && "pointer-events-none opacity-60 delay-150"
      )}
    >
      {children}
    </div>
  );
}
