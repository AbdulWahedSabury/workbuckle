import type { Metadata } from "next";
import Link from "next/link";
import { Plus } from "lucide-react";
import AdminOnly from "@/components/admin/AdminOnly";
import PageHeader from "@/components/admin/PageHeader";
import { ListView } from "@/components/admin/data-table";
import PeopleTable from "@/components/admin/tables/PeopleTable";
import { primaryLinkClass } from "@/components/admin/styles";
import { requireView } from "@/lib/admin/auth";
import { getPeopleCounts, type PeopleFilters } from "@/lib/admin/queries";
import { cn } from "@/lib/utils";
import { CANDIDATE_STATUSES, type CandidateStatus } from "@/schemas/AdminSchemas";

export const metadata: Metadata = { title: "Talent pool" };

const first = (v: string | string[] | undefined) => (Array.isArray(v) ? v[0] : v);

/** ?status=open|hired|inactive and ?nojob=1 narrow the pool. */
function parseFilters(params: Record<string, string | string[] | undefined>): PeopleFilters {
  const status = first(params.status);
  return {
    status: CANDIDATE_STATUSES.includes(status as CandidateStatus) ? (status as CandidateStatus) : undefined,
    withoutJob: first(params.nojob) === "1",
  };
}

export default async function PeoplePage({ searchParams }: PageProps<"/admin/people">) {
  await requireView("people");
  const filters = parseFilters(await searchParams);
  const counts = await getPeopleCounts();
  const tabs = [
    { label: "All", count: counts.all, href: "/admin/people", active: !filters.status && !filters.withoutJob },
    { label: "Open", count: counts.open, href: "/admin/people?status=open", active: filters.status === "open" && !filters.withoutJob },
    { label: "Open, no job yet", count: null, href: "/admin/people?status=open&nojob=1", active: filters.status === "open" && filters.withoutJob },
    { label: "No job yet", count: counts.withoutJob, href: "/admin/people?nojob=1", active: !filters.status && filters.withoutJob },
    { label: "Hired", count: counts.hired, href: "/admin/people?status=hired", active: filters.status === "hired" },
    { label: "Inactive", count: counts.inactive, href: "/admin/people?status=inactive", active: filters.status === "inactive" },
  ];

  return (
    <>
      <PageHeader
        title="Talent pool"
        description="Everyone you have on file, with or without a job. Open candidates are available to put forward."
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
            {tab.count !== null && <span className="tabular-nums opacity-70">{tab.count}</span>}
          </Link>
        ))}
      </nav>
      <ListView searchLabel="Search candidates" searchPlaceholder="Search by name, email or phone" columnCount={6}>
        <PeopleTable searchParams={searchParams} filters={filters} />
      </ListView>
    </>
  );
}
