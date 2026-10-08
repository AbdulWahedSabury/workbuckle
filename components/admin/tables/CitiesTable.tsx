import Link from "next/link";
import { Pencil, SearchX } from "lucide-react";
import { deleteCity } from "@/lib/admin/actions/cities";
import { parseListParams } from "@/lib/admin/list-params";
import {
  CITY_SORT_KEYS,
  listCities,
  type CitySortKey,
  type CityWithCount,
} from "@/lib/admin/queries";
import { DataTable, type Column } from "@/components/admin/data-table";
import { DeleteButton } from "@/components/admin/buttons";
import EmptyState from "@/components/admin/EmptyState";
import { iconButtonClass } from "@/components/admin/styles";
import { formatDate } from "./format";

const columns: Column<CityWithCount, CitySortKey>[] = [
  {
    id: "name",
    header: "Name",
    sortKey: "name",
    cell: (city) => <span className="font-semibold text-ink">{city.name}</span>,
  },
  {
    id: "slug",
    header: "Slug",
    sortKey: "slug",
    hideBelow: "md",
    cell: (city) => <code className="font-mono text-xs">{city.slug}</code>,
  },
  {
    id: "state",
    header: "State / region",
    sortKey: "state",
    cell: (city) => city.state ?? <span className="text-gray-2/60">—</span>,
  },
  {
    id: "updatedAt",
    header: "Updated",
    sortKey: "updatedAt",
    hideBelow: "lg",
    cell: (city) => (
      <time dateTime={city.updatedAt.toISOString()} className="whitespace-nowrap">
        {formatDate(city.updatedAt)}
      </time>
    ),
  },
  {
    id: "actions",
    header: "Actions",
    hideHeader: true,
    align: "right",
    className: "w-px py-2",
    cell: (city) => (
      <div className="flex justify-end gap-1">
        <Link
          href={`/admin/cities/${city.id}/edit`}
          aria-label={`Edit ${city.name}`}
          title="Edit"
          className={iconButtonClass}
        >
          <Pencil aria-hidden="true" />
        </Link>
        <DeleteButton
          action={deleteCity.bind(null, city.id)}
          confirmMessage={`Delete "${city.name}"?`}
          label={`Delete ${city.name}`}
          disabledReason={
            city._count.jobs > 0 ? "In use by jobs — reassign them first" : undefined
          }
        />
      </div>
    ),
  },
];

export default async function CitiesTable({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const params = parseListParams(await searchParams, CITY_SORT_KEYS);
  const { rows, ...pageInfo } = await listCities(params);

  return (
    <DataTable
      caption="Cities"
      columns={columns}
      rows={rows}
      getRowKey={(city) => city.id}
      pagination={{ ...pageInfo, itemLabel: "cities" }}
      empty={
        params.q ? (
          <EmptyState
            icon={SearchX}
            title={`No cities match “${params.q}”`}
            description="Try a different name or region."
          />
        ) : (
          <EmptyState title="No cities yet" description="Add the first city to get started." />
        )
      }
    />
  );
}
