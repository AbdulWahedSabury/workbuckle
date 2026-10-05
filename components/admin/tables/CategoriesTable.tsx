import Link from "next/link";
import { Eye, EyeOff, ImageOff, Pencil, SearchX } from "lucide-react";
import { deleteCategory, toggleCategoryActive } from "@/lib/admin/actions/categories";
import { parseListParams } from "@/lib/admin/list-params";
import {
  CATEGORY_SORT_KEYS,
  categoryDisplayName,
  listCategories,
  type CategorySortKey,
} from "@/lib/admin/queries";
import { DataTable, type Column } from "@/components/admin/data-table";
import { DeleteButton } from "@/components/admin/buttons";
import EmptyState from "@/components/admin/EmptyState";
import StatusBadge from "@/components/admin/StatusBadge";
import { iconButtonClass } from "@/components/admin/styles";
import { cn } from "@/lib/utils";
import { locales } from "@/types/locale";

type CategoryRow = Awaited<ReturnType<typeof listCategories>>["rows"][number] & {
  name: string;
  locales: Set<string>;
};

const columns: Column<CategoryRow, CategorySortKey>[] = [
  {
    id: "name",
    header: "Category",
    sortKey: "name",
    cell: (category) => (
      <div className="flex items-center gap-3">
        {category.imageUrl ? (
          // eslint-disable-next-line @next/next/no-img-element -- arbitrary admin-entered hosts
          <img
            src={category.imageUrl}
            alt=""
            className="size-10 shrink-0 rounded-xl border border-line bg-white object-contain p-1"
          />
        ) : (
          <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-gray-3 text-gray-2/70">
            <ImageOff className="size-4" aria-hidden="true" />
          </span>
        )}
        <span className="font-semibold text-ink">{category.name}</span>
      </div>
    ),
  },
  {
    id: "slug",
    header: "Slug",
    sortKey: "slug",
    hideBelow: "md",
    cell: (category) => <code className="font-mono text-xs">{category.slug}</code>,
  },
  {
    id: "translations",
    header: "Translations",
    hideBelow: "lg",
    cell: (category) => (
      <div className="flex gap-1">
        {locales.map((locale) => {
          const done = category.locales.has(locale);
          return (
            <StatusBadge
              key={locale}
              tone={done ? "success" : "neutral"}
              dot={false}
              className={cn("uppercase", !done && "line-through")}
            >
              {locale}
              <span className="sr-only">{done ? " translated" : " missing"}</span>
            </StatusBadge>
          );
        })}
      </div>
    ),
  },
  {
    id: "sortOrder",
    header: "Order",
    sortKey: "sortOrder",
    align: "right",
    hideBelow: "sm",
    cell: (category) => <span className="tabular-nums">{category.sortOrder}</span>,
  },
  {
    id: "status",
    header: "Status",
    sortKey: "status",
    cell: (category) => (
      <form action={toggleCategoryActive.bind(null, category.id)}>
        <button
          type="submit"
          title={category.isActive ? "Click to hide on the site" : "Click to show on the site"}
          className="rounded-full transition-transform focus-visible:ring-2 focus-visible:ring-primary focus-visible:outline-none active:scale-95"
        >
          <StatusBadge
            tone={category.isActive ? "success" : "neutral"}
            className="transition-[filter] hover:brightness-95"
          >
            {category.isActive ? "Visible" : "Hidden"}
            {category.isActive ? (
              <Eye className="size-3.5" aria-hidden="true" />
            ) : (
              <EyeOff className="size-3.5" aria-hidden="true" />
            )}
          </StatusBadge>
        </button>
      </form>
    ),
  },
  {
    id: "actions",
    header: "Actions",
    hideHeader: true,
    align: "right",
    className: "w-px py-2",
    cell: (category) => (
      <div className="flex justify-end gap-1">
        <Link
          href={`/admin/categories/${category.id}/edit`}
          aria-label={`Edit ${category.name}`}
          title="Edit"
          className={iconButtonClass}
        >
          <Pencil aria-hidden="true" />
        </Link>
        <DeleteButton
          action={deleteCategory.bind(null, category.id)}
          confirmMessage={`Delete "${category.name}" and all its translations?`}
          label={`Delete ${category.name}`}
        />
      </div>
    ),
  },
];

export default async function CategoriesTable({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const params = parseListParams(await searchParams, CATEGORY_SORT_KEYS);
  const { rows: categories, ...pageInfo } = await listCategories(params);
  const rows: CategoryRow[] = categories.map((category) => ({
    ...category,
    name: categoryDisplayName(category),
    locales: new Set(category.translations.map((t) => t.locale)),
  }));

  return (
    <DataTable
      caption="Job categories"
      columns={columns}
      rows={rows}
      getRowKey={(category) => category.id}
      pagination={{ ...pageInfo, itemLabel: "categories" }}
      empty={
        params.q ? (
          <EmptyState
            icon={SearchX}
            title={`No categories match “${params.q}”`}
            description="Search looks at slugs and names in every language."
          />
        ) : (
          <EmptyState
            title="No categories yet"
            description="Categories group jobs on the public site."
          />
        )
      }
    />
  );
}
