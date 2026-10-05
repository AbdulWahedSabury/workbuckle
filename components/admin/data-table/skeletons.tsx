/** Placeholder for a <DataTable> while its rows stream in. */
export function TableSkeleton({ columns, rows = 6 }: { columns: number; rows?: number }) {
  return (
    <div
      role="status"
      aria-label="Loading"
      className="overflow-hidden rounded-sm-card border border-line bg-white"
    >
      <div className="flex h-11 items-center gap-6 border-b border-line bg-gray-3/60 px-4">
        {Array.from({ length: columns }, (_, i) => (
          <span key={i} className="h-2.5 w-16 rounded-full bg-ink/8" />
        ))}
      </div>
      <div className="divide-y divide-line">
        {Array.from({ length: rows }, (_, row) => (
          <div key={row} className="flex h-15 items-center gap-6 px-4">
            {Array.from({ length: columns }, (_, col) => (
              <span
                key={col}
                className="h-3 flex-1 animate-pulse rounded-full bg-gray-3 motion-reduce:animate-none"
                style={{ maxWidth: col === 0 ? 220 : 120 }}
              />
            ))}
          </div>
        ))}
      </div>
      <div className="flex h-15 items-center justify-between border-t border-line px-4">
        <span className="h-3 w-40 rounded-full bg-gray-3" />
        <span className="h-8 w-32 rounded-full bg-gray-3" />
      </div>
    </div>
  );
}

/** Placeholder for the search toolbar, shown until URL state is readable. */
export function ToolbarSkeleton() {
  return <div className="mb-4 h-11 w-full rounded-full border border-line bg-white sm:max-w-sm" />;
}
