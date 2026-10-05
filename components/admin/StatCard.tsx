import Link from "next/link";
import type { LucideIcon } from "lucide-react";
import { ArrowUpRight } from "lucide-react";

export type StatCardProps = {
  label: string;
  value: number | string;
  detail?: string;
  icon: LucideIcon;
  href?: string;
};

/** Dashboard metric tile. Becomes a link with a hover lift when `href` is set. */
export default function StatCard({ label, value, detail, icon: Icon, href }: StatCardProps) {
  const body = (
    <>
      <div className="flex items-start justify-between gap-3">
        <span className="flex size-10 items-center justify-center rounded-full bg-primary/15 text-ink">
          <Icon className="size-[18px]" aria-hidden="true" />
        </span>
        {href && (
          <span
            aria-hidden="true"
            className="flex size-8 items-center justify-center rounded-full text-gray-2 transition-[background-color,color,transform] duration-300 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 group-hover:bg-primary group-hover:text-on-primary"
          >
            <ArrowUpRight className="size-4" />
          </span>
        )}
      </div>
      <p className="mt-5 font-heading text-4xl font-semibold text-ink tabular-nums">{value}</p>
      <p className="mt-1 text-sm font-semibold text-ink">{label}</p>
      {detail && <p className="mt-0.5 text-sm text-gray-2">{detail}</p>}
    </>
  );

  const className =
    "group block rounded-sm-card border border-line bg-white p-5 sm:p-6";

  return href ? (
    <Link
      href={href}
      className={`${className} transition-[border-color,box-shadow,transform] duration-300 hover:-translate-y-0.5 hover:border-primary/40 hover:shadow-[0_16px_40px_-24px_rgb(14_14_14/0.35)] focus-visible:ring-2 focus-visible:ring-primary focus-visible:outline-none motion-reduce:hover:translate-y-0`}
    >
      {body}
    </Link>
  ) : (
    <div className={className}>{body}</div>
  );
}

export function StatGridSkeleton({ count = 4 }: { count?: number }) {
  return (
    <div role="status" aria-label="Loading" className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
      {Array.from({ length: count }, (_, i) => (
        <div key={i} className="h-[178px] rounded-sm-card border border-line bg-white p-6">
          <span className="block size-10 animate-pulse rounded-full bg-gray-3 motion-reduce:animate-none" />
          <span className="mt-6 block h-8 w-16 animate-pulse rounded-full bg-gray-3 motion-reduce:animate-none" />
          <span className="mt-3 block h-3 w-28 animate-pulse rounded-full bg-gray-3 motion-reduce:animate-none" />
        </div>
      ))}
    </div>
  );
}
