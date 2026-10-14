import type { Metadata } from "next";
import { notFound } from "next/navigation";
import PageHeader from "@/components/admin/PageHeader";
import FaqForm from "@/components/admin/FaqForm";
import { updateFaq } from "@/lib/admin/actions/faqs";
import { requireAdmin } from "@/lib/admin/auth";
import { getFaq } from "@/lib/admin/queries";

export const metadata: Metadata = { title: "Edit FAQ" };

export default async function EditFaqPage({ params }: PageProps<"/admin/faqs/[id]/edit">) {
  await requireAdmin();
  const { id } = await params;
  const faq = await getFaq(id);
  if (!faq) notFound();

  return (
    <>
      <PageHeader title="Edit FAQ" />
      <FaqForm
        action={updateFaq.bind(null, faq.id)}
        faq={{
          question: faq.question,
          answer: faq.answer,
          isActive: faq.isActive,
          sortOrder: faq.sortOrder,
        }}
        submitLabel="Save changes"
      />
    </>
  );
}
