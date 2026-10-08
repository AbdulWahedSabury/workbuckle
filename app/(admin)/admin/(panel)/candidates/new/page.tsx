import type { Metadata } from "next";
import { connection } from "next/server";
import PageHeader from "@/components/admin/PageHeader";
import CandidateForm from "@/components/admin/CandidateForm";
import { requireAdmin } from "@/lib/admin/auth";
import { getCandidateJobOptions } from "@/lib/admin/queries";
import { createCandidate } from "@/lib/admin/actions/candidates";

export const metadata: Metadata = { title: "New candidate" };

export default async function NewCandidatePage() {
  await connection();
  await requireAdmin();
  const jobs = await getCandidateJobOptions();

  return (
    <>
      <PageHeader title="New candidate" />
      <CandidateForm action={createCandidate} jobs={jobs} submitLabel="Add candidate" />
    </>
  );
}
