import type { Metadata } from "next";
import { connection } from "next/server";
import PageHeader from "@/components/admin/PageHeader";
import FaqForm from "@/components/admin/FaqForm";
import { requireAdmin } from "@/lib/admin/auth";
import { createFaq } from "@/lib/admin/actions/faqs";

export const metadata: Metadata = { title: "New FAQ" };

export default async function NewFaqPage() {
  await connection();
  await requireAdmin();

  return (
    <>
      <PageHeader title="New FAQ" />
      <FaqForm action={createFaq} submitLabel="Create FAQ" />
    </>
  );
}
