import type { Metadata } from "next";
import Link from "next/link";
import { Plus } from "lucide-react";
import AdminOnly from "@/components/admin/AdminOnly";
import PageHeader from "@/components/admin/PageHeader";
import { ListView } from "@/components/admin/data-table";
import FaqsTable from "@/components/admin/tables/FaqsTable";
import { primaryLinkClass } from "@/components/admin/styles";
import { requireView } from "@/lib/admin/auth";

export const metadata: Metadata = { title: "FAQs" };

export default async function FaqsPage({ searchParams }: PageProps<"/admin/faqs">) {
  await requireView("faqs");

  return (
    <>
      <PageHeader
        title="FAQs"
        description="Questions and answers shown in the FAQ section on the home and contact pages."
        actions={
          <AdminOnly>
            <Link href="/admin/faqs/new" className={primaryLinkClass}>
              <Plus aria-hidden="true" /> New FAQ
            </Link>
          </AdminOnly>
        }
      />
      <ListView
        searchLabel="Search FAQs"
        searchPlaceholder="Search questions and answers"
        columnCount={5}
      >
        <FaqsTable searchParams={searchParams} />
      </ListView>
    </>
  );
}
