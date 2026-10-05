import { Suspense } from "react";
import Link from "next/link";
import { connection } from "next/server";
import { Eye, EyeOff, MapPin, Tags } from "lucide-react";
import PageHeader from "@/components/admin/PageHeader";
import StatCard, { StatGridSkeleton } from "@/components/admin/StatCard";
import StatusBadge from "@/components/admin/StatusBadge";
import { DataTable, TableSkeleton, type Column } from "@/components/admin/data-table";
import { formatDate } from "@/components/admin/tables/format";
import { getAdminCounts, listRecentChanges, type RecentChange } from "@/lib/admin/queries";

export default function AdminDashboardPage() {
  return (
    <>
      <PageHeader title="Dashboard" description="An overview of the content on the public site." />

      <section aria-labelledby="metrics-heading">
        <h2 id="metrics-heading" className="sr-only">
          Metrics
        </h2>
        <Suspense fallback={<StatGridSkeleton />}>
          <DashboardMetrics />
        </Suspense>
      </section>

      <section aria-labelledby="recent-heading" className="mt-10">
        <div className="mb-4 flex items-end justify-between gap-4">
          <h2 id="recent-heading" className="text-xl text-gray-1">
            Recent changes
          </h2>
        </div>
        <Suspense fallback={<TableSkeleton columns={3} rows={4} />}>
          <RecentChanges />
        </Suspense>
      </section>
    </>
  );
}

async function DashboardMetrics() {
  await connection();
  const { categories, activeCategories, cities } = await getAdminCounts();
  const hidden = categories - activeCategories;

  return (
    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
      <StatCard href="/admin/categories" label="Job categories" value={categories} icon={Tags} />
      <StatCard
        href="/admin/categories?sort=status&dir=asc"
        label="Visible on site"
        value={activeCategories}
        detail={categories ? `${Math.round((activeCategories / categories) * 100)}% of categories` : undefined}
        icon={Eye}
      />
      <StatCard
        href="/admin/categories?sort=status&dir=desc"
        label="Hidden"
        value={hidden}
        detail={hidden ? "Not shown to visitors" : "Everything is live"}
        icon={EyeOff}
      />
      <StatCard href="/admin/cities" label="Cities" value={cities} icon={MapPin} />
    </div>
  );
}

const recentColumns: Column<RecentChange>[] = [
  {
    id: "name",
    header: "Item",
    cell: (item) => (
      <Link
        href={item.href}
        className="font-semibold text-gray-1 underline-offset-4 hover:text-primary-dark hover:underline"
      >
        {item.name}
      </Link>
    ),
  },
  {
    id: "kind",
    header: "Type",
    cell: (item) => (
      <StatusBadge tone={item.kind === "category" ? "brand" : "neutral"} dot={false}>
        {item.kind === "category" ? "Category" : "City"}
      </StatusBadge>
    ),
  },
  {
    id: "updatedAt",
    header: "Updated",
    align: "right",
    cell: (item) => (
      <time dateTime={item.updatedAt.toISOString()} className="whitespace-nowrap">
        {formatDate(item.updatedAt)}
      </time>
    ),
  },
];

async function RecentChanges() {
  await connection();
  const items = await listRecentChanges();

  return (
    <DataTable
      caption="Recently updated categories and cities"
      columns={recentColumns}
      rows={items}
      getRowKey={(item) => `${item.kind}-${item.id}`}
      empty={
        <p className="rounded-sm-card border border-dashed border-ink/15 bg-white p-10 text-center text-sm text-gray-1">
          Nothing has been edited yet.
        </p>
      }
    />
  );
}
