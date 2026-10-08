import type { Metadata } from "next";
import Link from "next/link";
import { Plus } from "lucide-react";
import PageHeader from "@/components/admin/PageHeader";
import { ListView } from "@/components/admin/data-table";
import JobTypesTable from "@/components/admin/tables/JobTypesTable";
import { primaryLinkClass } from "@/components/admin/styles";

export const metadata: Metadata = { title: "Job types" };

export default function JobTypesPage({ searchParams }: PageProps<"/admin/job-types">) {
  return (
    <>
      <PageHeader
        title="Job types"
        description="Employment types jobs can be posted as, e.g. Full-time or Part-time."
        actions={
          <Link href="/admin/job-types/new" className={primaryLinkClass}>
            <Plus aria-hidden="true" /> New job type
          </Link>
        }
      />
      <ListView
        searchLabel="Search job types"
        searchPlaceholder="Search by name or slug"
        columnCount={5}
      >
        <JobTypesTable searchParams={searchParams} />
      </ListView>
    </>
  );
}
