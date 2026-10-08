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
import { formatDate } from "./format";

const STATUS_BADGE: Record<string, { tone: StatusTone; label: string }> = {
  published: { tone: "success", label: "Published" },
  draft: { tone: "neutral", label: "Draft" },
  closed: { tone: "danger", label: "Closed" },
};

const columns: Column<JobListRow, JobSortKey>[] = [
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
          aria-label={`View ${job._count.candidates} candidates for ${job.title}`}
          title={`Candidates (${job._count.candidates})`}
          className={`${iconButtonClass} relative`}
        >
          <Users aria-hidden="true" />
          {job._count.candidates > 0 && (
            <span className="absolute -top-0.5 -right-0.5 flex min-w-4 items-center justify-center rounded-full bg-primary px-1 text-[10px] leading-4 font-bold text-gray-100">
              {job._count.candidates}
            </span>
          )}
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
                {job._count.candidates > 0 &&
                  `, along with its ${job._count.candidates} ${job._count.candidates === 1 ? "candidate" : "candidates"}`}
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
