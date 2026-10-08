import Link from "next/link";
import type { LucideIcon } from "lucide-react";
import { ArrowDownRight, ArrowUpRight, Minus } from "lucide-react";
import { cn } from "@/lib/utils";

export type KpiTrend = { value: number; label: string };

export type KpiCardProps = {
  label: string;
  value: number | string;
  icon: LucideIcon;
  href: string;
  detail?: string;
  /** Change against a previous period; the sign picks the arrow. */
  trend?: KpiTrend;
  /** 0–1, drawn as a thin bar under the value. */
  progress?: { ratio: number; label: string };
  /** Brand-orange tile; use for one headline metric per row. */
  featured?: boolean;
};

/** Headline metric tile on the dashboard. Always a link to its section. */
export default function KpiCard({
  label,
  value,
  icon: Icon,
  href,
  detail,
  trend,
  progress,
  featured = false,
}: KpiCardProps) {
  const TrendIcon = !trend || trend.value === 0 ? Minus : trend.value > 0 ? ArrowUpRight : ArrowDownRight;

  return (
    <Link
      href={href}
      className={cn(
        "group relative flex flex-col overflow-hidden rounded-sm-card border p-5 transition-[border-color,box-shadow,transform] duration-300 hover:-translate-y-0.5 focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-gray-3 focus-visible:outline-none motion-reduce:hover:translate-y-0 sm:p-6",
        featured
          ? "border-transparent bg-primary text-on-primary hover:shadow-[0_20px_44px_-20px_rgb(252_112_28/0.7)]"
          : "border-line bg-white hover:border-primary/40 hover:shadow-[0_16px_40px_-24px_rgb(14_14_14/0.35)]"
      )}
    >
      {featured && (
        <span
          aria-hidden="true"
          className="pointer-events-none absolute -top-16 -right-16 size-44 rounded-full bg-[#fff]/20 blur-2xl"
        />
      )}

      <div className="relative flex items-center justify-between gap-3">
        <span
          className={cn(
            "flex size-10 items-center justify-center rounded-xl",
            featured ? "bg-on-primary/10" : "bg-primary/12 text-primary-dark"
          )}
        >
          <Icon className="size-[18px]" aria-hidden="true" />
        </span>
        <span
          aria-hidden="true"
          className={cn(
            "flex size-8 items-center justify-center rounded-full transition-[background-color,color,transform] duration-300 group-hover:translate-x-0.5 group-hover:-translate-y-0.5",
            featured
              ? "bg-on-primary/10 group-hover:bg-on-primary group-hover:text-primary"
              : "text-gray-2 group-hover:bg-primary group-hover:text-on-primary"
          )}
        >
          <ArrowUpRight className="size-4" />
        </span>
      </div>

      <p
        className={cn(
          "relative mt-6 text-sm font-semibold",
          featured ? "text-on-primary/80" : "text-gray-2"
        )}
      >
        {label}
      </p>
      <p
        className={cn(
          "relative mt-1 font-heading text-4xl font-semibold tabular-nums",
          featured ? "text-on-primary" : "text-ink"
        )}
      >
        {value}
      </p>

      <div className="relative mt-auto pt-4">
        {progress && (
          <div className="mb-3">
            <div
              className={cn("h-1.5 overflow-hidden rounded-full", featured ? "bg-on-primary/15" : "bg-gray-3")}
              role="img"
              aria-label={progress.label}
            >
              <div
                className={cn("h-full rounded-full", featured ? "bg-on-primary" : "bg-primary")}
                style={{ width: `${Math.round(Math.min(1, Math.max(0, progress.ratio)) * 100)}%` }}
              />
            </div>
          </div>
        )}
        {(trend || detail) && (
          <p className="flex flex-wrap items-center gap-x-2 gap-y-1 text-xs">
            {trend && (
              <span
                className={cn(
                  "inline-flex items-center gap-0.5 rounded-full px-2 py-0.5 font-semibold",
                  featured
                    ? "bg-on-primary/10 text-on-primary"
                    : trend.value > 0
                      ? "bg-emerald-50 text-emerald-800"
                      : trend.value < 0
                        ? "bg-red-50 text-red-700"
                        : "bg-gray-3 text-gray-2"
                )}
              >
                <TrendIcon className="size-3.5" aria-hidden="true" />
                {trend.value > 0 ? "+" : ""}
                {trend.value}
              </span>
            )}
            <span className={featured ? "text-on-primary/75" : "text-gray-2"}>
              {trend ? trend.label : detail}
            </span>
          </p>
        )}
      </div>
    </Link>
  );
}

export function KpiGridSkeleton({ count = 4 }: { count?: number }) {
  return (
    <div role="status" aria-label="Loading" className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
      {Array.from({ length: count }, (_, i) => (
        <div key={i} className="h-[196px] rounded-sm-card border border-line bg-white p-6">
          <span className="block size-10 animate-pulse rounded-xl bg-gray-3 motion-reduce:animate-none" />
          <span className="mt-6 block h-3 w-24 animate-pulse rounded-full bg-gray-3 motion-reduce:animate-none" />
          <span className="mt-3 block h-8 w-16 animate-pulse rounded-full bg-gray-3 motion-reduce:animate-none" />
        </div>
      ))}
    </div>
  );
}
