import Link from "next/link";
import { Pencil, SearchX, Users } from "lucide-react";
import { deleteJob } from "@/lib/admin/actions/jobs";
import { parseListParams } from "@/lib/admin/list-params";
import { JOB_SORT_KEYS, listJobs, type JobListRow, type JobSortKey } from "@/lib/admin/queries";
import { DataTable, type Column } from "@/components/admin/data-table";
import AdminOnly from "@/components/admin/AdminOnly";
import { DeleteButton } from "@/components/admin/buttons";
import EmptyState from "@/components/admin/EmptyState";
import StatusBadge, { type StatusTone } from "@/components/admin/StatusBadge";
import { iconButtonClass } from "@/components/admin/styles";
import type { ApplicationStatus } from "@/schemas/AdminSchemas";
import { APPLICATION_STATUS_BADGE } from "@/components/admin/status-labels";
import { formatDate } from "./format";

export const STATUS_BADGE: Record<string, { tone: StatusTone; label: string }> = {
  published: { tone: "success", label: "Published" },
  draft: { tone: "neutral", label: "Draft" },
  closed: { tone: "danger", label: "Closed" },
};

/** The stages shown per job; rejected and cancelled stay in the candidates list. */
const PIPELINE_COUNTS = [
  "pending",
  "under_review",
  "shortlisted",
  "submitted",
  "interview",
  "hired",
] as const satisfies readonly ApplicationStatus[];

const columns: Column<JobListRow, JobSortKey>[] = [
  { id: "client", header: "Client", sortKey: "client", hideBelow: "md", cell: (job) => job.client.name },
  {
    id: "title",
    header: "Title",
    sortKey: "title",
    cell: (job) => (
      <div className="flex flex-col">
        <span className="font-semibold text-ink">{job.title}</span>
        <span className="text-xs text-gray-2">{job.salary}</span>
      </div>
    ),
  },
  {
    id: "type",
    header: "Type",
    sortKey: "type",
    hideBelow: "md",
    cell: (job) => job.jobType.name,
  },
  {
    id: "city",
    header: "City",
    sortKey: "city",
    hideBelow: "sm",
    cell: (job) => job.city.name,
  },
  {
    id: "status",
    header: "Status",
    sortKey: "status",
    cell: (job) => {
      const badge = STATUS_BADGE[job.status] ?? { tone: "neutral" as const, label: job.status };
      return <StatusBadge tone={badge.tone}>{badge.label}</StatusBadge>;
    },
  },
  {
    id: "positions",
    header: "Positions",
    hideBelow: "sm",
    cell: (job) => {
      const remaining = Math.max(0, job.totalPositions - job.filledPositions);
      return (
        <div className="flex flex-col whitespace-nowrap">
          <span className="font-semibold tabular-nums text-ink">
            {job.filledPositions}/{job.totalPositions} filled
          </span>
          <span className="text-xs text-gray-2">
            {remaining ? `${remaining} remaining` : "Full"}
          </span>
        </div>
      );
    },
  },
  {
    id: "candidates",
    header: "Candidates by status",
    cell: (job) => (
      <div
        role="group"
        aria-label={`Candidates by status for ${job.title}`}
        className="grid w-64 grid-cols-2 gap-1.5"
      >
        {PIPELINE_COUNTS.map((status) => (
          <CandidateCountLink
            key={status}
            jobId={job.id}
            status={status}
            label={APPLICATION_STATUS_BADGE[status].label}
            tone={APPLICATION_STATUS_BADGE[status].tone}
            count={job.candidateStatusCounts[status]}
          />
        ))}
      </div>
    ),
  },
  {
    id: "updatedAt",
    header: "Updated",
    sortKey: "updatedAt",
    hideBelow: "lg",
    cell: (job) => (
      <time dateTime={job.updatedAt.toISOString()} className="whitespace-nowrap">
        {formatDate(job.updatedAt)}
      </time>
    ),
  },
  {
    id: "actions",
    header: "Actions",
    hideHeader: true,
    align: "right",
    className: "w-px py-2",
    cell: (job) => (
      <div className="flex justify-end gap-1">
        <Link
          href={`/admin/candidates?job=${job.id}`}
          aria-label={`View candidates for ${job.title}`}
          title="View candidates"
          className={iconButtonClass}
        >
          <Users aria-hidden="true" />
        </Link>
        <AdminOnly>
          <Link
            href={`/admin/jobs/${job.id}/edit`}
            aria-label={`Edit ${job.title}`}
            title="Edit"
            className={iconButtonClass}
          >
            <Pencil aria-hidden="true" />
          </Link>
          <DeleteButton
            action={deleteJob.bind(null, job.id)}
            title="Delete this job?"
            description={
              <>
                <strong>{job.title}</strong> will be permanently deleted
                {job._count.applications > 0 &&
                  `, along with its ${job._count.applications} ${job._count.applications === 1 ? "application" : "applications"}`}
                .
              </>
            }
            label={`Delete ${job.title}`}
            successMessage="Job deleted."
          />
        </AdminOnly>
      </div>
    ),
  },
];

function CandidateCountLink({
  jobId,
  status,
  label,
  tone,
  count,
}: {
  jobId: string;
  status: ApplicationStatus;
  label: string;
  tone: StatusTone;
  count: number;
}) {
  return (
    <Link
      href={`/admin/candidates?job=${encodeURIComponent(jobId)}&status=${encodeURIComponent(status)}`}
      aria-label={`View ${count} ${label.toLowerCase()} candidates`}
      title={`View ${label} candidates`}
      className="group flex min-w-0 items-center justify-between gap-2 rounded-lg border border-line bg-white px-2.5 py-1.5 text-xs transition-colors hover:border-primary/40 hover:bg-gray-3 focus-visible:ring-2 focus-visible:ring-primary focus-visible:outline-none"
    >
      <span className="flex min-w-0 items-center gap-1.5">
        <span
          aria-hidden="true"
          className={`size-1.5 shrink-0 rounded-full ${
            tone === "brand" ? "bg-primary" : tone === "success" ? "bg-emerald-500" : tone === "danger" ? "bg-red-500" : "bg-gray-2/50"
          }`}
        />
        <span className="truncate text-gray-2 transition-colors group-hover:text-ink">{label}</span>
      </span>
      <span className="min-w-6 rounded-md bg-gray-3 px-1.5 py-0.5 text-center font-semibold tabular-nums text-ink">
        {count}
      </span>
    </Link>
  );
}

export default async function JobsTable({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const params = parseListParams(await searchParams, JOB_SORT_KEYS);
  const { rows, ...pageInfo } = await listJobs(params);

  return (
    <DataTable
      caption="Jobs"
      columns={columns}
      rows={rows}
      getRowKey={(job) => job.id}
      pagination={{ ...pageInfo, itemLabel: "jobs" }}
      empty={
        params.q ? (
          <EmptyState
            icon={SearchX}
            title={`No jobs match “${params.q}”`}
            description="Try a different title, city or job type."
          />
        ) : (
          <EmptyState title="No jobs yet" description="Post the first job to get started." />
        )
      }
    />
  );
}
