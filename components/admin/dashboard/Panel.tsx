import Link from "next/link";
import type { ReactNode } from "react";
import { ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";

/** Titled card that holds one dashboard widget. */
export default function Panel({
  id,
  title,
  description,
  action,
  className,
  children,
}: {
  /** Used for the heading's id, so the section can be labelled by it. */
  id: string;
  title: string;
  description?: string;
  action?: { href: string; label: string };
  className?: string;
  children: ReactNode;
}) {
  return (
    <section
      aria-labelledby={`${id}-heading`}
      className={cn("flex min-w-0 flex-col rounded-sm-card border border-line bg-white p-5 sm:p-6", className)}
    >
      <div className="mb-5 flex items-start justify-between gap-4">
        <div className="min-w-0">
          <h2 id={`${id}-heading`} className="text-base text-ink">
            {title}
          </h2>
          {description && <p className="mt-0.5 text-sm text-gray-2">{description}</p>}
        </div>
        {action && (
          <Link
            href={action.href}
            className="inline-flex shrink-0 items-center gap-0.5 rounded-full px-2.5 py-1 text-xs font-semibold text-gray-2 transition-colors hover:bg-gray-3 hover:text-ink focus-visible:ring-2 focus-visible:ring-primary focus-visible:outline-none"
          >
            {action.label}
            <ChevronRight className="size-3.5" aria-hidden="true" />
          </Link>
        )}
      </div>
      {children}
    </section>
  );
}

export function PanelSkeleton({ className, height = 260 }: { className?: string; height?: number }) {
  return (
    <div
      role="status"
      aria-label="Loading"
      className={cn("rounded-sm-card border border-line bg-white p-6", className)}
      style={{ minHeight: height }}
    >
      <span className="block h-4 w-32 animate-pulse rounded-full bg-gray-3 motion-reduce:animate-none" />
      <span className="mt-2 block h-3 w-48 animate-pulse rounded-full bg-gray-3 motion-reduce:animate-none" />
      <span
        className="mt-8 block w-full animate-pulse rounded-2xl bg-gray-3 motion-reduce:animate-none"
        style={{ height: height - 110 }}
      />
    </div>
  );
}
