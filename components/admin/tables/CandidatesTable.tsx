import Link from "next/link";
import { ExternalLink, Eye, SearchX } from "lucide-react";
import { deleteCandidate } from "@/lib/admin/actions/candidates";
import { parseListParams } from "@/lib/admin/list-params";
import {
  CANDIDATE_SORT_KEYS,
  listCandidates,
  type CandidateListRow,
  type CandidateSortKey,
} from "@/lib/admin/queries";
import { DataTable, type Column } from "@/components/admin/data-table";
import { DeleteButton } from "@/components/admin/buttons";
import CandidateStatusSelect from "@/components/admin/CandidateStatusSelect";
import EmptyState from "@/components/admin/EmptyState";
import StatusBadge, { type StatusTone } from "@/components/admin/StatusBadge";
import { iconButtonClass } from "@/components/admin/styles";
import { formatDate } from "./format";

const STATUS_BADGE: Record<string, { tone: StatusTone; label: string }> = {
  pending: { tone: "neutral", label: "Pending" },
  success: { tone: "success", label: "Success" },
  rejected: { tone: "danger", label: "Rejected" },
};

const fullName = (c: CandidateListRow) => `${c.firstName} ${c.lastName}`;

const columns: Column<CandidateListRow, CandidateSortKey>[] = [
  {
    id: "name",
    header: "Candidate",
    sortKey: "name",
    cell: (c) => (
      <div className="flex flex-col">
        <Link href={`/admin/candidates/${c.id}`} className="font-semibold text-ink hover:underline">
          {fullName(c)}
        </Link>
        <a href={`mailto:${c.email}`} className="text-xs text-gray-2 hover:text-ink">
          {c.email}
        </a>
      </div>
    ),
  },
  {
    id: "phone",
    header: "Phone",
    hideBelow: "lg",
    cell: (c) => <span className="whitespace-nowrap">{c.phone}</span>,
  },
  {
    id: "job",
    header: "Applied for",
    sortKey: "job",
    hideBelow: "md",
    cell: (c) => (
      <Link href={`/admin/jobs/${c.job.id}/edit`} className="font-medium text-ink hover:underline">
        {c.job.title}
      </Link>
    ),
  },
  {
    id: "status",
    header: "Status",
    sortKey: "status",
    cell: (c) => {
      const badge = STATUS_BADGE[c.status] ?? { tone: "neutral" as const, label: c.status };
      return (
        <div className="flex flex-col items-start gap-2">
          <StatusBadge tone={badge.tone}>{badge.label}</StatusBadge>
          <CandidateStatusSelect id={c.id} status={c.status} name={fullName(c)} />
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
          href={c.cvUrl}
          target="_blank"
          rel="noopener noreferrer"
          aria-label={`Open CV of ${fullName(c)}`}
          title="Open CV"
          className={iconButtonClass}
        >
          <ExternalLink aria-hidden="true" />
        </a>
        <DeleteButton
          action={deleteCandidate.bind(null, c.id)}
          confirmMessage={`Delete candidate "${fullName(c)}" and their CV?`}
          label={`Delete ${fullName(c)}`}
        />
      </div>
    ),
  },
];

export default async function CandidatesTable({
  searchParams,
  jobId,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
  /** Only show candidates who applied for this job. */
  jobId?: string;
}) {
  const params = parseListParams(await searchParams, CANDIDATE_SORT_KEYS);
  const { rows, ...pageInfo } = await listCandidates(params, jobId);

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
