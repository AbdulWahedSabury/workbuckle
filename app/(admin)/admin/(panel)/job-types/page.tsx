import type { Metadata } from "next";
import Link from "next/link";
import { Plus } from "lucide-react";
import AdminOnly from "@/components/admin/AdminOnly";
import PageHeader from "@/components/admin/PageHeader";
import { ListView } from "@/components/admin/data-table";
import JobTypesTable from "@/components/admin/tables/JobTypesTable";
import { primaryLinkClass } from "@/components/admin/styles";
import { requireView } from "@/lib/admin/auth";

export const metadata: Metadata = { title: "Job types" };

export default async function JobTypesPage({ searchParams }: PageProps<"/admin/job-types">) {
  await requireView("jobTypes");

  return (
    <>
      <PageHeader
        title="Job types"
        description="Employment types jobs can be posted as, e.g. Full-time or Part-time."
        actions={
          <AdminOnly>
            <Link href="/admin/job-types/new" className={primaryLinkClass}>
              <Plus aria-hidden="true" /> New job type
            </Link>
          </AdminOnly>
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
