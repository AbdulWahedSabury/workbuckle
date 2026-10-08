import type { Metadata } from "next";
import Link from "next/link";
import { Plus } from "lucide-react";
import AdminOnly from "@/components/admin/AdminOnly";
import PageHeader from "@/components/admin/PageHeader";
import { ListView } from "@/components/admin/data-table";
import CitiesTable from "@/components/admin/tables/CitiesTable";
import { primaryLinkClass } from "@/components/admin/styles";
import { requireView } from "@/lib/admin/auth";

export const metadata: Metadata = { title: "Cities" };

export default async function CitiesPage({ searchParams }: PageProps<"/admin/cities">) {
  await requireView("cities");

  return (
    <>
      <PageHeader
        title="Cities"
        description="Locations jobs can be posted in."
        actions={
          <AdminOnly>
            <Link href="/admin/cities/new" className={primaryLinkClass}>
              <Plus aria-hidden="true" /> New city
            </Link>
          </AdminOnly>
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
