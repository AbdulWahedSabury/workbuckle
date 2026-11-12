import type { Metadata } from "next";
import { connection } from "next/server";
import PageHeader from "@/components/admin/PageHeader";
import PositionForm from "@/components/admin/PositionForm";
import { requireAdmin } from "@/lib/admin/auth";
import { createPosition } from "@/lib/admin/actions/positions";

export const metadata: Metadata = { title: "New position" };

export default async function NewPositionPage() {
  await connection();
  await requireAdmin();

  return (
    <>
      <PageHeader title="New position" />
      <PositionForm action={createPosition} submitLabel="Create position" />
    </>
  );
}
