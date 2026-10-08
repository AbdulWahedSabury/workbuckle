import type { Metadata } from "next";
import Link from "next/link";
import { Plus } from "lucide-react";
import PageHeader from "@/components/admin/PageHeader";
import { ListView } from "@/components/admin/data-table";
import UsersTable from "@/components/admin/tables/UsersTable";
import { primaryLinkClass } from "@/components/admin/styles";
import { requireView } from "@/lib/admin/auth";

export const metadata: Metadata = { title: "Users" };

export default async function UsersPage({ searchParams }: PageProps<"/admin/users">) {
  await requireView("users");

  return (
    <>
      <PageHeader
        title="Users"
        description="Who can sign in to this panel. Admins can change everything; employers and viewers are read-only."
        actions={
          <Link href="/admin/users/new" className={primaryLinkClass}>
            <Plus aria-hidden="true" /> New user
          </Link>
        }
      />
      <ListView
        searchLabel="Search users"
        searchPlaceholder="Search by email or name"
        columnCount={4}
      >
        <UsersTable searchParams={searchParams} />
      </ListView>
    </>
  );
}
