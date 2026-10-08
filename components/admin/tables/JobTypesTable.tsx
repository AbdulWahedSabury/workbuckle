import Link from "next/link";
import { Pencil, SearchX } from "lucide-react";
import { deleteJobType } from "@/lib/admin/actions/job-types";
import { parseListParams } from "@/lib/admin/list-params";
import {
  JOB_TYPE_SORT_KEYS,
  listJobTypes,
  type JobTypeSortKey,
  type JobTypeWithCount,
} from "@/lib/admin/queries";
import { DataTable, type Column } from "@/components/admin/data-table";
import { DeleteButton } from "@/components/admin/buttons";
import { viewerCanEdit } from "@/lib/admin/auth";
import EmptyState from "@/components/admin/EmptyState";
import StatusBadge from "@/components/admin/StatusBadge";
import { iconButtonClass } from "@/components/admin/styles";
import { formatDate } from "./format";

const columns: Column<JobTypeWithCount, JobTypeSortKey>[] = [
  {
    id: "name",
    header: "Name",
    sortKey: "name",
    cell: (type) => <span className="font-semibold text-ink">{type.name}</span>,
  },
  {
    id: "slug",
    header: "Slug",
    sortKey: "slug",
    hideBelow: "md",
    cell: (type) => <code className="font-mono text-xs">{type.slug}</code>,
  },
  {
    id: "jobs",
    header: "Jobs",
    sortKey: "jobs",
    cell: (type) =>
      type._count.jobs > 0 ? (
        <StatusBadge tone="brand" dot={false}>
          {type._count.jobs} {type._count.jobs === 1 ? "job" : "jobs"}
        </StatusBadge>
      ) : (
        <span className="text-gray-2/60">Unused</span>
      ),
  },
  {
    id: "updatedAt",
    header: "Updated",
    sortKey: "updatedAt",
    hideBelow: "lg",
    cell: (type) => (
      <time dateTime={type.updatedAt.toISOString()} className="whitespace-nowrap">
        {formatDate(type.updatedAt)}
      </time>
    ),
  },
  {
    id: "actions",
    header: "Actions",
    hideHeader: true,
    align: "right",
    className: "w-px py-2",
    cell: (type) => (
      <div className="flex justify-end gap-1">
        <Link
          href={`/admin/job-types/${type.id}/edit`}
          aria-label={`Edit ${type.name}`}
          title="Edit"
          className={iconButtonClass}
        >
          <Pencil aria-hidden="true" />
        </Link>
        <DeleteButton
          action={deleteJobType.bind(null, type.id)}
          title="Delete this job type?"
          description={
            <>
              <strong>{type.name}</strong> will be permanently removed from the job types.
            </>
          }
          label={`Delete ${type.name}`}
          successMessage="Job type deleted."
          disabledReason={
            type._count.jobs > 0 ? "In use by jobs — reassign them first" : undefined
          }
        />
      </div>
    ),
  },
];

export default async function JobTypesTable({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const params = parseListParams(await searchParams, JOB_TYPE_SORT_KEYS);
  const { rows, ...pageInfo } = await listJobTypes(params);
  const canEdit = await viewerCanEdit();

  return (
    <DataTable
      caption="Job types"
      // Read-only roles get no Actions column: it only holds edit/delete.
      columns={canEdit ? columns : columns.filter((c) => c.id !== "actions")}
      rows={rows}
      getRowKey={(type) => type.id}
      pagination={{ ...pageInfo, itemLabel: "job types" }}
      empty={
        params.q ? (
          <EmptyState
            icon={SearchX}
            title={`No job types match “${params.q}”`}
            description="Try a different name or slug."
          />
        ) : (
          <EmptyState
            title="No job types yet"
            description="Add types like Full-time or Part-time to get started."
          />
        )
      }
    />
  );
}
