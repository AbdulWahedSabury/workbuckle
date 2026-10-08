import type { Metadata } from "next";
import { notFound } from "next/navigation";
import PageHeader from "@/components/admin/PageHeader";
import JobTypeForm from "@/components/admin/JobTypeForm";
import { updateJobType } from "@/lib/admin/actions/job-types";
import { requireAdmin } from "@/lib/admin/auth";
import { getJobType } from "@/lib/admin/queries";

export const metadata: Metadata = { title: "Edit job type" };

export default async function EditJobTypePage({
  params,
}: PageProps<"/admin/job-types/[id]/edit">) {
  await requireAdmin();
  const { id } = await params;
  const jobType = await getJobType(id);
  if (!jobType) notFound();

  return (
    <>
      <PageHeader title="Edit job type" description={jobType.slug} />
      <JobTypeForm
        action={updateJobType.bind(null, jobType.id)}
        jobType={{ name: jobType.name, slug: jobType.slug }}
        submitLabel="Save changes"
      />
    </>
  );
}
