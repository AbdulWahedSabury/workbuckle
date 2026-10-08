import type { Metadata } from "next";
import Link from "next/link";
import { Plus } from "lucide-react";
import PageHeader from "@/components/admin/PageHeader";
import { ListView } from "@/components/admin/data-table";
import JobsTable from "@/components/admin/tables/JobsTable";
import { primaryLinkClass } from "@/components/admin/styles";

export const metadata: Metadata = { title: "Jobs" };

export default function JobsPage({ searchParams }: PageProps<"/admin/jobs">) {
  return (
    <>
      <PageHeader
        title="Jobs"
        description="Vacancies, from drafts to closed roles."
        actions={
          <Link href="/admin/jobs/new" className={primaryLinkClass}>
            <Plus aria-hidden="true" /> New job
          </Link>
        }
      />
      <ListView
        searchLabel="Search jobs"
        searchPlaceholder="Search by title, city or type"
        columnCount={6}
      >
        <JobsTable searchParams={searchParams} />
      </ListView>
    </>
  );
}
