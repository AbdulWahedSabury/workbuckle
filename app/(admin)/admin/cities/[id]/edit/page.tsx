import type { Metadata } from "next";
import { notFound } from "next/navigation";
import PageHeader from "@/components/admin/PageHeader";
import CityForm from "@/components/admin/CityForm";
import { updateCity } from "@/lib/admin/actions/cities";
import { getCity } from "@/lib/admin/queries";

export const metadata: Metadata = { title: "Edit city" };

export default async function EditCityPage({
  params,
}: PageProps<"/admin/cities/[id]/edit">) {
  const { id } = await params;
  const city = await getCity(id);
  if (!city) notFound();

  return (
    <>
      <PageHeader title="Edit city" description={city.slug} />
      <CityForm
        action={updateCity.bind(null, city.id)}
        city={{ name: city.name, slug: city.slug, state: city.state }}
        submitLabel="Save changes"
      />
    </>
  );
}
