import type { Metadata } from "next";
import { notFound } from "next/navigation";
import PageHeader from "@/components/admin/PageHeader";
import CategoryForm from "@/components/admin/CategoryForm";
import { updateCategory } from "@/lib/admin/actions/categories";
import { getCategory } from "@/lib/admin/queries";

export const metadata: Metadata = { title: "Edit category" };

export default async function EditCategoryPage({
  params,
}: PageProps<"/admin/categories/[id]/edit">) {
  const { id } = await params;
  const category = await getCategory(id);
  if (!category) notFound();

  const names = Object.fromEntries(
    category.translations.map((t) => [t.locale, t.name])
  );

  return (
    <>
      <PageHeader title="Edit category" description={category.slug} />
      <CategoryForm
        action={updateCategory.bind(null, category.id)}
        category={{
          slug: category.slug,
          imageUrl: category.imageUrl,
          isActive: category.isActive,
          sortOrder: category.sortOrder,
          names,
        }}
        submitLabel="Save changes"
      />
    </>
  );
}
