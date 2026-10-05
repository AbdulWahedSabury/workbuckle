import type { Metadata } from "next";
import { connection } from "next/server";
import PageHeader from "@/components/admin/PageHeader";
import CityForm from "@/components/admin/CityForm";
import { requireAdmin } from "@/lib/admin/auth";
import { createCity } from "@/lib/admin/actions/cities";

export const metadata: Metadata = { title: "New city" };

export default async function NewCityPage() {
  await connection();
  await requireAdmin();

  return (
    <>
      <PageHeader title="New city" />
      <CityForm action={createCity} submitLabel="Create city" />
    </>
  );
}
