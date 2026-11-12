import Link from "next/link";
import { ExternalLink, Eye, SearchX } from "lucide-react";
import { deleteApplication } from "@/lib/admin/actions/applications";
import { parseListParams } from "@/lib/admin/list-params";
import {
  CANDIDATE_SORT_KEYS,
  listApplications,
  type ApplicationListRow,
  type CandidateSortKey,
} from "@/lib/admin/queries";
import type { ApplicationStatus } from "@/schemas/AdminSchemas";
import { DataTable, type Column } from "@/components/admin/data-table";
import AdminOnly from "@/components/admin/AdminOnly";
import { DeleteButton } from "@/components/admin/buttons";
import ApplicationStatusSelect from "@/components/admin/ApplicationStatusSelect";
import EmptyState from "@/components/admin/EmptyState";
import StatusBadge from "@/components/admin/StatusBadge";
import { APPLICATION_STATUS_BADGE, CANDIDATE_STATUS_BADGE, badgeFor } from "@/components/admin/status-labels";
import { iconButtonClass } from "@/components/admin/styles";
import { formatDate } from "./format";

const fullName = (c: ApplicationListRow) => `${c.candidate.firstName} ${c.candidate.lastName}`;

const columns: Column<ApplicationListRow, CandidateSortKey>[] = [
  {
    id: "name",
    header: "Candidate",
    sortKey: "name",
    cell: (c) => (
      <div className="flex flex-col">
        <Link href={`/admin/candidates/${c.id}`} className="font-semibold text-ink hover:underline">
          {fullName(c)}
        </Link>
        <a href={`mailto:${c.candidate.email}`} className="text-xs text-gray-2 hover:text-ink">
          {c.candidate.email}
        </a>
        {c.candidate.status !== "open" && (
          // Hired or inactive people can't be put forward for other jobs; flag it on every row.
          <StatusBadge tone="neutral" dot={false} className="mt-1 self-start">
            {`Candidate ${badgeFor(CANDIDATE_STATUS_BADGE, c.candidate.status).label.toLowerCase()}`}
          </StatusBadge>
        )}
      </div>
    ),
  },
  {
    id: "phone",
    header: "Phone",
    hideBelow: "lg",
    cell: (c) => <span className="whitespace-nowrap">{c.candidate.phone}</span>,
  },
  {
    id: "job",
    header: "Applied for",
    sortKey: "job",
    hideBelow: "md",
    cell: (c) => (
      // Read-only roles can't open the job editor; link to its applicants instead.
      <AdminOnly
        fallback={
          <Link
            href={`/admin/candidates?job=${c.job.id}`}
            className="font-medium text-ink hover:underline"
          >
            {c.job.title}
          </Link>
        }
      >
        <Link
          href={`/admin/jobs/${c.job.id}/edit`}
          className="font-medium text-ink hover:underline"
        >
          {c.job.title}
        </Link>
      </AdminOnly>
    ),
  },
  {
    id: "status",
    header: "Status",
    sortKey: "status",
    cell: (c) => {
      const badge = badgeFor(APPLICATION_STATUS_BADGE, c.status);
      return (
        <div className="flex flex-col items-start gap-2">
          <StatusBadge tone={badge.tone}>{badge.label}</StatusBadge>
          <AdminOnly>
            <ApplicationStatusSelect id={c.id} status={c.status} name={fullName(c)} />
          </AdminOnly>
        </div>
      );
    },
  },
  {
    id: "createdAt",
    header: "Applied",
    sortKey: "createdAt",
    hideBelow: "lg",
    cell: (c) => (
      <time dateTime={c.createdAt.toISOString()} className="whitespace-nowrap">
        {formatDate(c.createdAt)}
      </time>
    ),
  },
  {
    id: "actions",
    header: "Actions",
    hideHeader: true,
    align: "right",
    className: "w-px py-2",
    cell: (c) => (
      <div className="flex justify-end gap-1">
        <Link
          href={`/admin/candidates/${c.id}`}
          aria-label={`View profile of ${fullName(c)}`}
          title="View profile"
          className={iconButtonClass}
        >
          <Eye aria-hidden="true" />
        </Link>
        <a
          href={`/admin/candidates/${c.id}/cv`}
          target="_blank"
          rel="noopener noreferrer"
          aria-label={`Open CV of ${fullName(c)}`}
          title="Open CV"
          className={iconButtonClass}
        >
          <ExternalLink aria-hidden="true" />
        </a>
        <AdminOnly>
          <DeleteButton
            action={deleteApplication.bind(null, c.id)}
            title="Delete this application?"
            description={
              <>
                <strong>{fullName(c)}</strong>&rsquo;s application for {c.job.title} and its CV
                will be permanently deleted. They stay in the talent pool.
              </>
            }
            label={`Delete ${fullName(c)}`}
            successMessage="Application deleted."
            disabledReason={c.status === "hired" ? "Hired applications can’t be deleted" : undefined}
          />
        </AdminOnly>
      </div>
    ),
  },
];

export default async function CandidatesTable({
  searchParams,
  jobId,
  status,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
  /** Only show candidates who applied for this job. */
  jobId?: string;
  /** Only show candidates in this recruiting stage. */
  status?: ApplicationStatus;
}) {
  const params = parseListParams(await searchParams, CANDIDATE_SORT_KEYS);
  const { rows, ...pageInfo } = await listApplications(params, jobId, status);

  return (
    <DataTable
      caption="Candidates"
      columns={columns}
      rows={rows}
      getRowKey={(c) => c.id}
      pagination={{ ...pageInfo, itemLabel: "candidates" }}
      empty={
        params.q ? (
          <EmptyState
            icon={SearchX}
            title={`No candidates match “${params.q}”`}
            description="Try a different name, email or job title."
          />
        ) : (
          <EmptyState
            title="No candidates yet"
            description="Applications will show up here once candidates are added."
          />
        )
      }
    />
  );
}
