import type { Metadata } from "next";
import Link from "next/link";
import { Plus } from "lucide-react";
import AdminOnly from "@/components/admin/AdminOnly";
import PageHeader from "@/components/admin/PageHeader";
import { ListView } from "@/components/admin/data-table";
import PeopleTable from "@/components/admin/tables/PeopleTable";
import PositionFilter from "@/components/admin/PositionFilter";
import { primaryLinkClass } from "@/components/admin/styles";
import { requireView } from "@/lib/admin/auth";
import { getPeopleCounts, getPositionOptions, type PeopleFilters } from "@/lib/admin/queries";
import { cn } from "@/lib/utils";

export const metadata: Metadata = { title: "Talent pool" };

const first = (v: string | string[] | undefined) => (Array.isArray(v) ? v[0] : v);

/** Available (open) people by default; ?status=inactive shows the inactive ones; ?position=<id> narrows to one position. */
function parseFilters(params: Record<string, string | string[] | undefined>, positionIds: string[]): PeopleFilters {
  const position = first(params.position);
  return {
    status: first(params.status) === "inactive" ? "inactive" : "open",
    positionId: position && positionIds.includes(position) ? position : undefined,
  };
}

/** A tab's link, keeping the position filter. */
function tabHref(status: "open" | "inactive", positionId?: string): string {
  const params = new URLSearchParams();
  if (status === "inactive") params.set("status", "inactive");
  if (positionId) params.set("position", positionId);
  const query = params.toString();
  return query ? `/admin/people?${query}` : "/admin/people";
}

export default async function PeoplePage({ searchParams }: PageProps<"/admin/people">) {
  await requireView("people");
  const positions = await getPositionOptions();
  const filters = parseFilters(await searchParams, positions.map((p) => p.value));
  const counts = await getPeopleCounts(filters.positionId);
  const tabs = [
    { label: "Available", count: counts.open, href: tabHref("open", filters.positionId), active: filters.status === "open" },
    { label: "Inactive", count: counts.inactive, href: tabHref("inactive", filters.positionId), active: filters.status === "inactive" },
  ];

  return (
    <>
      <PageHeader
        title="Talent pool"
        description="People free to put forward: not hired, and no job in progress. Anyone pending, in review, submitted or interviewing for a job is under Candidates."
        actions={
          <AdminOnly>
            <Link href="/admin/candidates/new" className={primaryLinkClass}>
              <Plus aria-hidden="true" /> New candidate
            </Link>
          </AdminOnly>
        }
      />
      <nav aria-label="Filter the talent pool" className="mb-4 flex flex-wrap gap-2">
        {tabs.map((tab) => (
          <Link
            key={tab.label}
            href={tab.href}
            aria-current={tab.active ? "page" : undefined}
            className={cn(
              "inline-flex h-9 items-center gap-2 rounded-full border px-4 text-sm font-semibold transition-colors",
              tab.active ? "border-ink bg-ink text-gray-3" : "border-line bg-white text-ink hover:bg-gray-3"
            )}
          >
            {tab.label}
            <span className="tabular-nums opacity-70">{tab.count}</span>
          </Link>
        ))}
      </nav>
      <ListView
        searchLabel="Search candidates"
        searchPlaceholder="Search by name, email or phone"
        columnCount={7}
        toolbar={<PositionFilter options={positions} value={filters.positionId} />}
      >
        <PeopleTable searchParams={searchParams} filters={filters} />
      </ListView>
    </>
  );
}
