import type { Metadata } from "next";
import { notFound } from "next/navigation";
import PageHeader from "@/components/admin/PageHeader";
import PositionForm from "@/components/admin/PositionForm";
import { updatePosition } from "@/lib/admin/actions/positions";
import { requireAdmin } from "@/lib/admin/auth";
import { getPosition } from "@/lib/admin/queries";

export const metadata: Metadata = { title: "Edit position" };

export default async function EditPositionPage({ params }: PageProps<"/admin/positions/[id]/edit">) {
  await requireAdmin();
  const { id } = await params;
  const position = await getPosition(id);
  if (!position) notFound();

  return (
    <>
      <PageHeader title="Edit position" description={position.slug} />
      <PositionForm
        action={updatePosition.bind(null, position.id)}
        position={{ name: position.name, slug: position.slug }}
        submitLabel="Save changes"
      />
    </>
  );
}
