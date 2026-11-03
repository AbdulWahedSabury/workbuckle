import type { Metadata } from "next";
import Link from "next/link";
import { Plus } from "lucide-react";
import AdminOnly from "@/components/admin/AdminOnly";
import PageHeader from "@/components/admin/PageHeader";
import { ListView } from "@/components/admin/data-table";
import ClientsTable from "@/components/admin/tables/ClientsTable";
import { primaryLinkClass } from "@/components/admin/styles";
import { requireView } from "@/lib/admin/auth";

export const metadata: Metadata = { title: "Clients" };
export default async function ClientsPage({ searchParams }: PageProps<"/admin/clients">) {
  await requireView("clients");
  return <><PageHeader title="Clients" description="Client contact details and their job listings." actions={<AdminOnly><Link href="/admin/clients/new" className={primaryLinkClass}><Plus aria-hidden="true" /> New client</Link></AdminOnly>} /><ListView searchLabel="Search clients" searchPlaceholder="Search by name, email or phone" columnCount={6}><ClientsTable searchParams={searchParams} /></ListView></>;
}
