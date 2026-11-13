import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, Pencil, Sparkles, Users } from "lucide-react";
import AdminOnly from "@/components/admin/AdminOnly";
import EmptyState from "@/components/admin/EmptyState";
import PageHeader from "@/components/admin/PageHeader";
import StatusBadge from "@/components/admin/StatusBadge";
import AssignedCandidates from "@/components/admin/jobs/AssignedCandidates";
import MatchedCandidates from "@/components/admin/jobs/MatchedCandidates";
import { cardClass, secondaryLinkClass } from "@/components/admin/styles";
import { STATUS_BADGE } from "@/components/admin/tables/JobsTable";
import { requireView, viewerCanEdit } from "@/lib/admin/auth";
import { remainingPositions } from "@/lib/jobs/capacity";
import {
  getJobMatchDetail,
  getMatchedCandidates,
  getPoolIndexStats,
  type JobMatchDetail,
} from "@/lib/matching/queries";

export const metadata: Metadata = { title: "Job" };

const sectionTitle = "font-heading text-base font-semibold text-ink";

function Detail({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-1">
      <dt className="text-xs font-semibold tracking-wider text-gray-2 uppercase">{label}</dt>
      <dd className="text-sm break-words text-ink">{children}</dd>
    </div>
  );
}

/** A job with its assigned candidates and the talent pool ranked by CV match. Not for client users. */
export default async function JobPage({ params }: PageProps<"/admin/jobs/[id]">) {
  await requireView("people");
  const { id } = await params;
  const job = await getJobMatchDetail(id);
  if (!job) notFound();

  return (
    <>
      <PageHeader
        title={job.title}
        description={`${job.client.name} · ${job.city.name}`}
        actions={
          <>
            <Link href="/admin/jobs" className={secondaryLinkClass}>
              <ArrowLeft aria-hidden="true" /> Jobs
            </Link>
            <Link href={`/admin/candidates?job=${job.id}`} className={secondaryLinkClass}>
              <Users aria-hidden="true" /> Candidates
            </Link>
            <AdminOnly>
              <Link href={`/admin/jobs/${job.id}/edit`} className={secondaryLinkClass}>
                <Pencil aria-hidden="true" /> Edit
              </Link>
            </AdminOnly>
          </>
        }
      />

      <div className="flex max-w-5xl flex-col gap-6">
        <JobSummary job={job} />

        <section className={`${cardClass} flex flex-col gap-4 p-5 sm:p-6`}>
          <h2 className={sectionTitle}>
            Assigned candidates <span className="font-normal text-gray-2">({job.applications.length})</span>
          </h2>
          <AssignedCandidates applications={job.applications} jobTitle={job.title} />
        </section>

        <section className={`${cardClass} flex flex-col gap-4 p-5 sm:p-6`}>
          <div className="flex flex-col gap-1">
            <h2 className={`inline-flex items-center gap-2 ${sectionTitle}`}>
              <Sparkles className="size-4 text-primary" aria-hidden="true" /> Matched candidates
            </h2>
            <p className="text-sm text-gray-2">
              Available people in the talent pool, ranked by how closely their CV matches this job.
            </p>
          </div>
          <Matches job={job} />
        </section>
      </div>
    </>
  );
}

function JobSummary({ job }: { job: JobMatchDetail }) {
  const badge = STATUS_BADGE[job.status] ?? { tone: "neutral" as const, label: job.status };
  const remaining = remainingPositions(job);
  return (
    <section className={`${cardClass} p-5 sm:p-6`}>
      <dl className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
        <Detail label="Status">
          <StatusBadge tone={badge.tone}>{badge.label}</StatusBadge>
        </Detail>
        <Detail label="Positions">
          {job.filledPositions}/{job.totalPositions} filled · {remaining} remaining
        </Detail>
        <Detail label="Role">{job.position?.name ?? job.jobType.name}</Detail>
        <Detail label="Salary">{job.salary}</Detail>
      </dl>
    </section>
  );
}

async function Matches({ job }: { job: JobMatchDetail }) {
  // A re-save keeps showing the previous vector's matches until the new one lands.
  if (!job.embeddedAt) {
    return (
      <EmptyState
        icon={Sparkles}
        title="Matching is being prepared"
        description="This job is indexed in the background after it's saved. Refresh in a moment. Jobs saved before matching existed need the backfill (npm run embeddings:backfill)."
      />
    );
  }

  const [matches, stats, canEdit] = await Promise.all([
    getMatchedCandidates(job.id),
    getPoolIndexStats(),
    viewerCanEdit(),
  ]);
  const blocked = remainingPositions(job) ? undefined : "This job is closed or has no positions left.";

  return (
    <>
      <p className="text-xs text-gray-2">
        {stats.indexed} available {stats.indexed === 1 ? "CV is" : "CVs are"} indexed
        {stats.pending > 0 && ` · ${stats.pending} waiting to be indexed`}
        {stats.unreadable > 0 && ` · ${stats.unreadable} couldn't be read (old .doc or scanned PDF)`}
      </p>
      {matches.length ? (
        <MatchedCandidates jobId={job.id} candidates={matches} canAssign={canEdit} assignBlockedReason={blocked} />
      ) : (
        <EmptyState
          title="No matches yet"
          description="Nobody available in the talent pool has an indexed CV. Candidates appear here once their CV is uploaded and indexed."
        />
      )}
    </>
  );
}
