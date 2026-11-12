import type { Metadata } from "next";
import Link from "next/link";
import { Plus } from "lucide-react";
import AdminOnly from "@/components/admin/AdminOnly";
import PageHeader from "@/components/admin/PageHeader";
import { ListView } from "@/components/admin/data-table";
import PositionsTable from "@/components/admin/tables/PositionsTable";
import { primaryLinkClass } from "@/components/admin/styles";
import { requireView } from "@/lib/admin/auth";

export const metadata: Metadata = { title: "Positions" };

export default async function PositionsPage({ searchParams }: PageProps<"/admin/positions">) {
  await requireView("positions");

  return (
    <>
      <PageHeader
        title="Positions"
        description="Roles jobs hire for, such as Waiter or Bartender. Applicants get their job's position, so you can filter the talent pool by it."
        actions={
          <AdminOnly>
            <Link href="/admin/positions/new" className={primaryLinkClass}>
              <Plus aria-hidden="true" /> New position
            </Link>
          </AdminOnly>
        }
      />
      <ListView searchLabel="Search positions" searchPlaceholder="Search by name" columnCount={5}>
        <PositionsTable searchParams={searchParams} />
      </ListView>
    </>
  );
}
