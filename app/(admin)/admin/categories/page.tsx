import type { Metadata } from "next";
import Link from "next/link";
import { Plus } from "lucide-react";
import PageHeader from "@/components/admin/PageHeader";
import { ListView } from "@/components/admin/data-table";
import CategoriesTable from "@/components/admin/tables/CategoriesTable";
import { primaryLinkClass } from "@/components/admin/styles";

export const metadata: Metadata = { title: "Job categories" };

export default function CategoriesPage({ searchParams }: PageProps<"/admin/categories">) {
  return (
    <>
      <PageHeader
        title="Job categories"
        description="Shown on the site in sort order. Hidden categories stay in the database."
        actions={
          <Link href="/admin/categories/new" className={primaryLinkClass}>
            <Plus aria-hidden="true" /> New category
          </Link>
        } 
      />
      <ListView
        searchLabel="Search categories"
        searchPlaceholder="Search by name or slug"
        columnCount={6}
      >
        <CategoriesTable searchParams={searchParams} />
      </ListView>
    </>
  );
}
