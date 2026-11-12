import Link from "next/link";
import { Eye, SearchX } from "lucide-react";
import { deletePerson } from "@/lib/admin/actions/candidates";
import { parseListParams } from "@/lib/admin/list-params";
import {
  listPeople,
  PEOPLE_SORT_KEYS,
  type PeopleFilters,
  type PeopleSortKey,
  type PersonListRow,
} from "@/lib/admin/queries";
import { DataTable, type Column } from "@/components/admin/data-table";
import AdminOnly from "@/components/admin/AdminOnly";
import { DeleteButton } from "@/components/admin/buttons";
import EmptyState from "@/components/admin/EmptyState";
import StatusBadge from "@/components/admin/StatusBadge";
import { APPLICATION_STATUS_BADGE, CANDIDATE_STATUS_BADGE, badgeFor } from "@/components/admin/status-labels";
import { iconButtonClass } from "@/components/admin/styles";
import { formatDate } from "./format";

const fullName = (p: PersonListRow) => `${p.firstName} ${p.lastName}`;

function LatestApplication({ person }: { person: PersonListRow }) {
  const latest = person.applications[0];
  if (!latest) return <span className="text-gray-2">No job yet</span>;
  const badge = badgeFor(APPLICATION_STATUS_BADGE, latest.status);
  const more = person._count.applications - 1;
  return (
    <div className="flex flex-col items-start gap-1">
      <span className="font-medium text-ink">{latest.job.title}</span>
      <span className="flex items-center gap-2 text-xs text-gray-2">
        <StatusBadge tone={badge.tone} dot={false}>{badge.label}</StatusBadge>
        {more > 0 && `+${more} more`}
      </span>
    </div>
  );
}

const columns: Column<PersonListRow, PeopleSortKey>[] = [
  {
    id: "name",
    header: "Candidate",
    sortKey: "name",
    cell: (p) => (
      <div className="flex flex-col">
        <Link href={`/admin/people/${p.id}`} className="font-semibold text-ink hover:underline">
          {fullName(p)}
        </Link>
        <a href={`mailto:${p.email}`} className="text-xs text-gray-2 hover:text-ink">
          {p.email}
        </a>
      </div>
    ),
  },
  { id: "phone", header: "Phone", hideBelow: "lg", cell: (p) => <span className="whitespace-nowrap">{p.phone}</span> },
  {
    id: "status",
    header: "Availability",
    sortKey: "status",
    cell: (p) => {
      const badge = badgeFor(CANDIDATE_STATUS_BADGE, p.status);
      return <StatusBadge tone={badge.tone}>{badge.label}</StatusBadge>;
    },
  },
  {
    id: "positions",
    header: "Positions",
    cell: (p) =>
      p.positions.length ? (
        <span className="flex flex-wrap gap-1">
          {p.positions.map(({ position }) => (
            <span key={position.id} className="rounded-full border border-line px-2 py-0.5 text-xs whitespace-nowrap text-ink">
              {position.name}
            </span>
          ))}
        </span>
      ) : (
        <span className="text-gray-2/60">None</span>
      ),
  },
  { id: "applications", header: "Latest application", hideBelow: "md", cell: (p) => <LatestApplication person={p} /> },
  {
    id: "createdAt",
    header: "Added",
    sortKey: "createdAt",
    hideBelow: "lg",
    cell: (p) => (
      <time dateTime={p.createdAt.toISOString()} className="whitespace-nowrap">
        {formatDate(p.createdAt)}
      </time>
    ),
  },
  {
    id: "actions",
    header: "Actions",
    hideHeader: true,
    align: "right",
    className: "w-px py-2",
    cell: (p) => (
      <div className="flex justify-end gap-1">
        <Link href={`/admin/people/${p.id}`} aria-label={`View ${fullName(p)}`} title="View" className={iconButtonClass}>
          <Eye aria-hidden="true" />
        </Link>
        <AdminOnly>
          <DeleteButton
            action={deletePerson.bind(null, p.id)}
            title="Delete this candidate?"
            description={
              <>
                <strong>{fullName(p)}</strong>, their {p._count.applications === 1 ? "application" : `${p._count.applications} applications`}{" "}
                and CV will be permanently deleted.
              </>
            }
            label={`Delete ${fullName(p)}`}
            successMessage="Candidate deleted."
            disabledReason={p.status === "hired" ? "Hired candidates can’t be deleted" : undefined}
          />
        </AdminOnly>
      </div>
    ),
  },
];

export default async function PeopleTable({
  searchParams,
  filters,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
  filters: PeopleFilters;
}) {
  const params = parseListParams(await searchParams, PEOPLE_SORT_KEYS);
  const { rows, ...pageInfo } = await listPeople(params, filters);

  return (
    <DataTable
      caption="Talent pool"
      columns={columns}
      rows={rows}
      getRowKey={(p) => p.id}
      pagination={{ ...pageInfo, itemLabel: "candidates" }}
      empty={
        params.q ? (
          <EmptyState icon={SearchX} title={`No candidates match “${params.q}”`} description="Try a different name, email or phone." />
        ) : (
          <EmptyState
            title="No one in the pool here"
            description="People show here once they have no job in progress. Add a candidate without a job to build the pool."
          />
        )
      }
    />
  );
}
