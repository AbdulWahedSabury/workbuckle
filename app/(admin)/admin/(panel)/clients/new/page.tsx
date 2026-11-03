import type { Metadata } from "next";
import { connection } from "next/server";
import PageHeader from "@/components/admin/PageHeader";
import ClientForm from "@/components/admin/ClientForm";
import { requireAdmin } from "@/lib/admin/auth";
import { createClient } from "@/lib/admin/actions/clients";

export const metadata: Metadata = { title: "New client" };
export default async function NewClientPage() {
  await connection();
  await requireAdmin();
  return <><PageHeader title="New client" /><ClientForm action={createClient} submitLabel="Create client" /></>;
}
