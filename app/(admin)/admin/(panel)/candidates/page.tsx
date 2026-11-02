import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft, Plus } from "lucide-react";
import AdminOnly from "@/components/admin/AdminOnly";
import PageHeader from "@/components/admin/PageHeader";
import { ListView } from "@/components/admin/data-table";
import CandidatesTable from "@/components/admin/tables/CandidatesTable";
import { primaryLinkClass, secondaryLinkClass } from "@/components/admin/styles";
import { requireView } from "@/lib/admin/auth";
import { getJob } from "@/lib/admin/queries";
import { CANDIDATE_STATUSES, type CandidateStatus } from "@/schemas/AdminSchemas";

export const metadata: Metadata = { title: "Candidates" };

export default async function CandidatesPage({ searchParams }: PageProps<"/admin/candidates">) {
  await requireView("candidates");

  // ?job=<id> narrows the list to one job's applicants.
  const params = await searchParams;
  const rawJob = params.job;
  const jobParam = Array.isArray(rawJob) ? rawJob[0] : rawJob;
  const job = jobParam ? await getJob(jobParam) : null;
  const rawStatus = params.status;
  const statusParam = Array.isArray(rawStatus) ? rawStatus[0] : rawStatus;
  const status =
    typeof statusParam === "string" && CANDIDATE_STATUSES.includes(statusParam as CandidateStatus)
      ? (statusParam as CandidateStatus)
      : undefined;

  return (
    <>
      <PageHeader
        title={job ? `Candidates for ${job.title}${status ? ` · ${status}` : ""}` : "Candidates"}
        description={
          job
            ? status
              ? `Applicants with status ${status}.`
              : "Everyone who applied for this job. Track each application through the recruiting pipeline."
            : status
              ? `Candidates with status ${status}.`
              : "People who applied for a job. Review their CV and track each application through the recruiting pipeline."
        }
        actions={
          <>
            {job && (
              <Link href="/admin/jobs" className={secondaryLinkClass}>
                <ArrowLeft aria-hidden="true" /> Jobs
              </Link>
            )}
            {job && status && (
              <Link
                href={`/admin/candidates?job=${encodeURIComponent(job.id)}`}
                className={secondaryLinkClass}
              >
                All candidates
              </Link>
            )}
            <AdminOnly>
              <Link href="/admin/candidates/new" className={primaryLinkClass}>
                <Plus aria-hidden="true" /> New candidate
              </Link>
            </AdminOnly>
          </>
        }
      />
      <ListView
        searchLabel="Search candidates"
        searchPlaceholder="Search by name, email or job"
        columnCount={6}
      >
        <CandidatesTable searchParams={searchParams} jobId={job?.id} status={status} />
      </ListView>
    </>
  );
}
