import { SearchX, X } from "lucide-react";

/** Shown when a job list has no rows; offers to clear the filters when some are applied. */
export function JobsEmptyState({ onClear }: { onClear?: () => void }) {
  return (
    <div className="flex flex-col items-center rounded-sm-card border border-dashed border-line bg-white px-6 py-12 text-center">
      <span className="flex size-12 items-center justify-center rounded-full bg-primary/10 text-primary-dark">
        <SearchX className="size-5" aria-hidden="true" />
      </span>
      <p className="mt-4 text-base font-semibold text-ink">
        {onClear ? "No roles match your filters" : "No open roles right now"}
      </p>
      <p className="mt-1 max-w-sm text-sm text-gray-2">
        {onClear
          ? "Try another city, category or job type, or clear the filters to see every open role."
          : "New positions are added regularly. Check back soon."}
      </p>
      {onClear && (
        <button
          type="button"
          onClick={onClear}
          className="mt-5 inline-flex items-center gap-1.5 rounded-full bg-ink px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-gray-1 focus-visible:ring-2 focus-visible:ring-primary focus-visible:outline-none"
        >
          <X className="size-4" aria-hidden="true" />
          Clear filters
        </button>
      )}
    </div>
  );
}
