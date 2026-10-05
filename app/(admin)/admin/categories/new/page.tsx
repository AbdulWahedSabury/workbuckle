import type { Metadata } from "next";
import { connection } from "next/server";
import PageHeader from "@/components/admin/PageHeader";
import CategoryForm from "@/components/admin/CategoryForm";
import { requireAdmin } from "@/lib/admin/auth";
import { createCategory } from "@/lib/admin/actions/categories";

export const metadata: Metadata = { title: "New category" };

export default async function NewCategoryPage() {
  await connection();
  await requireAdmin();

  return (
    <>
      <PageHeader title="New category" />
      <CategoryForm action={createCategory} submitLabel="Create category" />
    </>
  );
}
