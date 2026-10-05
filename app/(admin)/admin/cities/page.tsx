import type { Metadata } from "next";
import Link from "next/link";
import { Plus } from "lucide-react";
import PageHeader from "@/components/admin/PageHeader";
import { ListView } from "@/components/admin/data-table";
import CitiesTable from "@/components/admin/tables/CitiesTable";
import { primaryLinkClass } from "@/components/admin/styles";

export const metadata: Metadata = { title: "Cities" };

export default function CitiesPage({ searchParams }: PageProps<"/admin/cities">) {
  return (
    <>
      <PageHeader
        title="Cities"
        description="Locations jobs can be posted in."
        actions={
          <Link href="/admin/cities/new" className={primaryLinkClass}>
            <Plus aria-hidden="true" /> New city
          </Link>
        }
      />
      <ListView
        searchLabel="Search cities"
        searchPlaceholder="Search by name or region"
        columnCount={5}
      >
        <CitiesTable searchParams={searchParams} />
      </ListView>
    </>
  );
}
