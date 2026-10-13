import type { Metadata } from "next";
import { connection } from "next/server";
import PageHeader from "@/components/admin/PageHeader";
import CampaignForm from "@/components/admin/CampaignForm";
import { requireAdmin } from "@/lib/admin/auth";
import { createCampaign } from "@/lib/admin/actions/campaigns";

export const metadata: Metadata = { title: "New campaign" };

export default async function NewCampaignPage() {
  await connection();
  await requireAdmin();

  return (
    <>
      <PageHeader title="New campaign" />
      <CampaignForm action={createCampaign} submitLabel="Create campaign" />
    </>
  );
}
