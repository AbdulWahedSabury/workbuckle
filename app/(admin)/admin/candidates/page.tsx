import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft, Plus } from "lucide-react";
import PageHeader from "@/components/admin/PageHeader";
import { ListView } from "@/components/admin/data-table";
import CandidatesTable from "@/components/admin/tables/CandidatesTable";
import { primaryLinkClass, secondaryLinkClass } from "@/components/admin/styles";
import { getJob } from "@/lib/admin/queries";

export const metadata: Metadata = { title: "Candidates" };

export default async function CandidatesPage({ searchParams }: PageProps<"/admin/candidates">) {
  // ?job=<id> narrows the list to one job's applicants.
  const raw = (await searchParams).job;
  const jobParam = Array.isArray(raw) ? raw[0] : raw;
  const job = jobParam ? await getJob(jobParam) : null;

  return (
    <>
      <PageHeader
        title={job ? `Candidates for ${job.title}` : "Candidates"}
        description={
          job
            ? "Everyone who applied for this job. Marking a candidate as success closes the job."
            : "People who applied for a job. Review their CV and mark them as success or rejected."
        }
        actions={
          <>
            {job && (
              <Link href="/admin/jobs" className={secondaryLinkClass}>
                <ArrowLeft aria-hidden="true" /> Jobs
              </Link>
            )}
            <Link href="/admin/candidates/new" className={primaryLinkClass}>
              <Plus aria-hidden="true" /> New candidate
            </Link>
          </>
        }
      />
      <ListView
        searchLabel="Search candidates"
        searchPlaceholder="Search by name, email or job"
        columnCount={6}
      >
        <CandidatesTable searchParams={searchParams} jobId={job?.id} />
      </ListView>
    </>
  );
}
