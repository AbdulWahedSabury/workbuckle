import type { Metadata } from "next";
import Link from "next/link";
import { Plus } from "lucide-react";
import AdminOnly from "@/components/admin/AdminOnly";
import PageHeader from "@/components/admin/PageHeader";
import { ListView } from "@/components/admin/data-table";
import CampaignsTable from "@/components/admin/tables/CampaignsTable";
import { primaryLinkClass } from "@/components/admin/styles";
import { requireView } from "@/lib/admin/auth";

export const metadata: Metadata = { title: "Campaigns" };

export default async function CampaignsPage({ searchParams }: PageProps<"/admin/campaigns">) {
  await requireView("campaigns");

  return (
    <>
      <PageHeader
        title="Campaigns"
        description="Themed groups of jobs, each with an image and intro. Assign jobs from the job form."
        actions={
          <AdminOnly>
            <Link href="/admin/campaigns/new" className={primaryLinkClass}>
              <Plus aria-hidden="true" /> New campaign
            </Link>
          </AdminOnly>
        }
      />
      <ListView
        searchLabel="Search campaigns"
        searchPlaceholder="Search by title or intro"
        columnCount={4}
      >
        <CampaignsTable searchParams={searchParams} />
      </ListView>
    </>
  );
}
