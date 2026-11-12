import Link from "next/link";
import { Pencil, SearchX } from "lucide-react";
import { deletePosition } from "@/lib/admin/actions/positions";
import { parseListParams } from "@/lib/admin/list-params";
import {
  listPositions,
  POSITION_SORT_KEYS,
  type PositionSortKey,
  type PositionWithCount,
} from "@/lib/admin/queries";
import { DataTable, type Column } from "@/components/admin/data-table";
import { DeleteButton } from "@/components/admin/buttons";
import { viewerCanEdit } from "@/lib/admin/auth";
import EmptyState from "@/components/admin/EmptyState";
import { iconButtonClass } from "@/components/admin/styles";
import { formatDate } from "./format";

const plural = (count: number, word: string) => `${count} ${count === 1 ? word : `${word}s`}`;

const columns: Column<PositionWithCount, PositionSortKey>[] = [
  {
    id: "name",
    header: "Name",
    sortKey: "name",
    cell: (position) => <span className="font-semibold text-ink">{position.name}</span>,
  },
  {
    id: "slug",
    header: "Slug",
    sortKey: "slug",
    hideBelow: "md",
    cell: (position) => <code className="font-mono text-xs">{position.slug}</code>,
  },
  {
    id: "jobs",
    header: "Jobs",
    sortKey: "jobs",
    align: "right",
    cell: (position) => <span className="tabular-nums">{position._count.jobs}</span>,
  },
  {
    id: "candidates",
    header: "Candidates",
    sortKey: "candidates",
    align: "right",
    cell: (position) => (
      <Link
        href={`/admin/people?position=${position.id}`}
        className="tabular-nums hover:underline"
        title="Everyone with this position. Opens the talent pool filtered by it (only people free to put forward)."
      >
        {position._count.candidates}
      </Link>
    ),
  },
  {
    id: "updatedAt",
    header: "Updated",
    sortKey: "updatedAt",
    hideBelow: "lg",
    cell: (position) => (
      <time dateTime={position.updatedAt.toISOString()} className="whitespace-nowrap">
        {formatDate(position.updatedAt)}
      </time>
    ),
  },
  {
    id: "actions",
    header: "Actions",
    hideHeader: true,
    align: "right",
    className: "w-px py-2",
    cell: (position) => (
      <div className="flex justify-end gap-1">
        <Link
          href={`/admin/positions/${position.id}/edit`}
          aria-label={`Edit ${position.name}`}
          title="Edit"
          className={iconButtonClass}
        >
          <Pencil aria-hidden="true" />
        </Link>
        <DeleteButton
          action={deletePosition.bind(null, position.id)}
          title="Delete this position?"
          description={
            <>
              <strong>{position.name}</strong> will be permanently removed
              {position._count.candidates > 0 && `, and from the ${plural(position._count.candidates, "candidate")} who have it`}.
            </>
          }
          label={`Delete ${position.name}`}
          successMessage="Position deleted."
          disabledReason={position._count.jobs > 0 ? "In use by jobs: change their position first" : undefined}
        />
      </div>
    ),
  },
];

export default async function PositionsTable({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const params = parseListParams(await searchParams, POSITION_SORT_KEYS);
  const { rows, ...pageInfo } = await listPositions(params);
  const canEdit = await viewerCanEdit();

  return (
    <DataTable
      caption="Positions"
      // Read-only roles get no Actions column: it only holds edit/delete.
      columns={canEdit ? columns : columns.filter((c) => c.id !== "actions")}
      rows={rows}
      getRowKey={(position) => position.id}
      pagination={{ ...pageInfo, itemLabel: "positions" }}
      empty={
        params.q ? (
          <EmptyState icon={SearchX} title={`No positions match “${params.q}”`} description="Try a different name." />
        ) : (
          <EmptyState title="No positions yet" description="Add the roles you hire for, such as Waiter or Bartender." />
        )
      }
    />
  );
}
