import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import { cn } from "@/lib/utils";

export default function ViewSiteLink({ className }: { className?: string }) {
  return (
    <Link
      href="/"
      target="_blank"
      className={cn(
        "group flex items-center justify-between rounded-sm-card bg-gray-3 p-4 text-sm font-semibold text-ink transition-colors hover:bg-ink hover:text-white focus-visible:ring-2 focus-visible:ring-primary focus-visible:outline-none",
        className
      )}
    >
      View live site
      <span className="flex size-8 items-center justify-center rounded-full bg-primary text-on-primary transition-transform duration-300 group-hover:translate-x-0.5 group-hover:-translate-y-0.5">
        <ArrowUpRight className="size-4" aria-hidden="true" />
      </span>
      <span className="sr-only">(opens in a new tab)</span>
    </Link>
  );
}
