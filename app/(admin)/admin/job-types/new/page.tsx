import type { Metadata } from "next";
import { connection } from "next/server";
import PageHeader from "@/components/admin/PageHeader";
import JobTypeForm from "@/components/admin/JobTypeForm";
import { requireAdmin } from "@/lib/admin/auth";
import { createJobType } from "@/lib/admin/actions/job-types";

export const metadata: Metadata = { title: "New job type" };

export default async function NewJobTypePage() {
  await connection();
  await requireAdmin();

  return (
    <>
      <PageHeader title="New job type" />
      <JobTypeForm action={createJobType} submitLabel="Create job type" />
    </>
  );
}
