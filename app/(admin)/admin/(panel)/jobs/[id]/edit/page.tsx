import type { Metadata } from "next";
import { notFound } from "next/navigation";
import PageHeader from "@/components/admin/PageHeader";
import JobForm from "@/components/admin/JobForm";
import { updateJob } from "@/lib/admin/actions/jobs";
import { requireAdmin } from "@/lib/admin/auth";
import { getJob, getJobFormOptions } from "@/lib/admin/queries";

export const metadata: Metadata = { title: "Edit job" };

export default async function EditJobPage({ params }: PageProps<"/admin/jobs/[id]/edit">) {
  await requireAdmin();
  const { id } = await params;
  const job = await getJob(id);
  if (!job) notFound();
  const options = await getJobFormOptions(job.jobCategoryId);

  return (
    <>
      <PageHeader title="Edit job" description={job.title} />
      <JobForm
        action={updateJob.bind(null, job.id)}
        initialJob={{
          title: job.title,
          salary: job.salary,
          experience: job.experience,
          cityId: job.cityId,
          jobTypeId: job.jobTypeId,
          jobCategoryId: job.jobCategoryId,
          description: job.description,
          responsibilities: job.responsibilities,
          requirements: job.requirements,
          benefits: job.benefits,
          status: job.status,
        }}
        options={options}
        submitLabel="Save changes"
      />
    </>
  );
}
