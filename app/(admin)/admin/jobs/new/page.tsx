import type { Metadata } from "next";
import { connection } from "next/server";
import PageHeader from "@/components/admin/PageHeader";
import JobForm from "@/components/admin/JobForm";
import { createJob } from "@/lib/admin/actions/jobs";
import { getJobFormOptions } from "@/lib/admin/queries";

export const metadata: Metadata = { title: "New job" };

export default async function NewJobPage() {
  await connection();
  const options = await getJobFormOptions();

  return (
    <>
      <PageHeader title="New job" />
      <JobForm action={createJob} options={options} submitLabel="Create job" />
    </>
  );
}
