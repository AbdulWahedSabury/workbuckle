import type { Metadata } from "next";
import { notFound } from "next/navigation";
import PageHeader from "@/components/admin/PageHeader";
import ClientForm from "@/components/admin/ClientForm";
import { updateClient } from "@/lib/admin/actions/clients";
import { requireAdmin } from "@/lib/admin/auth";
import { getClient } from "@/lib/admin/queries";

export const metadata: Metadata = { title: "Edit client" };
export default async function EditClientPage({ params }: PageProps<"/admin/clients/[id]/edit">) {
  await requireAdmin();
  const { id } = await params;
  const client = await getClient(id);
  if (!client) notFound();
  return <><PageHeader title="Edit client" description={client.name} /><ClientForm action={updateClient.bind(null, client.id)} client={{ name: client.name, email: client.email, phone: client.phone }} submitLabel="Save changes" /></>;
}
