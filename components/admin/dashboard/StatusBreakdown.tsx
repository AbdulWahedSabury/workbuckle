import Link from "next/link";
import { cn } from "@/lib/utils";

export type BreakdownItem = {
  key: string;
  label: string;
  count: number;
  /** Fill class for the bar segment and legend swatch, e.g. "bg-emerald-500". */
  color: string;
  href: string;
};

/**
 * A total split into parts: one stacked bar, then a legend row per part with
 * its count and share. The legend carries the labels, so identity is never
 * colour alone.
 */
export default function StatusBreakdown({
  items,
  totalLabel,
}: {
  items: BreakdownItem[];
  totalLabel: string;
}) {
  const total = items.reduce((sum, i) => sum + i.count, 0);
  const pct = (n: number) => (total ? Math.round((n / total) * 100) : 0);

  return (
    <div className="flex flex-1 flex-col">
      <p className="flex items-baseline gap-2">
        <span className="font-heading text-3xl font-semibold text-ink tabular-nums">{total}</span>
        <span className="text-sm text-gray-2">{totalLabel}</span>
      </p>

      <div aria-hidden="true" className="mt-4 flex h-3 gap-[2px] overflow-hidden rounded-full bg-gray-3">
        {total > 0 &&
          items
            .filter((i) => i.count > 0)
            .map((i) => (
              <span
                key={i.key}
                className={cn("h-full first:rounded-l-full last:rounded-r-full", i.color)}
                style={{ width: `${(i.count / total) * 100}%` }}
              />
            ))}
      </div>

      <ul className="mt-5 flex flex-col gap-1">
        {items.map((i) => (
          <li key={i.key}>
            <Link
              href={i.href}
              className="-mx-2 flex items-center gap-3 rounded-xl px-2 py-2 text-sm transition-colors hover:bg-gray-3 focus-visible:ring-2 focus-visible:ring-primary focus-visible:outline-none"
            >
              <span aria-hidden="true" className={cn("size-2.5 shrink-0 rounded-full", i.color)} />
              <span className="flex-1 font-semibold text-ink">{i.label}</span>
              <span className="text-gray-2 tabular-nums">{pct(i.count)}%</span>
              <span className="w-8 text-right font-semibold text-ink tabular-nums">{i.count}</span>
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
