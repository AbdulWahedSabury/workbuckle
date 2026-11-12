"use client";

import { useTransition } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import type { SelectOption } from "@/lib/admin/queries";

/** Narrows a list to one position via ?position=<id>; keeps the other filters, back to page 1. */
export default function PositionFilter({ options, value }: { options: SelectOption[]; value?: string }) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [pending, startTransition] = useTransition();

  function choose(positionId: string) {
    const params = new URLSearchParams(searchParams.toString());
    if (positionId) params.set("position", positionId);
    else params.delete("position");
    params.delete("page");
    const query = params.toString();
    startTransition(() => router.replace(query ? `${pathname}?${query}` : pathname, { scroll: false }));
  }

  return (
    <select
      aria-label="Filter by position"
      value={value ?? ""}
      disabled={pending}
      onChange={(e) => choose(e.target.value)}
      className="h-10 cursor-pointer rounded-full border border-line bg-white px-4 text-sm font-semibold text-ink outline-none focus-visible:ring-2 focus-visible:ring-primary disabled:opacity-50"
    >
      <option value="">All positions</option>
      {options.map((option) => (
        <option key={option.value} value={option.value}>
          {option.label}
        </option>
      ))}
    </select>
  );
}
