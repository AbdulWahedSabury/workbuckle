import Link from "next/link";
import { Eye, EyeOff, Pencil, SearchX } from "lucide-react";
import { deleteFaq, toggleFaqActive } from "@/lib/admin/actions/faqs";
import { parseListParams } from "@/lib/admin/list-params";
import { FAQ_SORT_KEYS, listFaqs, type FaqRow, type FaqSortKey } from "@/lib/admin/queries";
import { DataTable, type Column } from "@/components/admin/data-table";
import { DeleteButton } from "@/components/admin/buttons";
import { viewerCanEdit } from "@/lib/admin/auth";
import EmptyState from "@/components/admin/EmptyState";
import StatusBadge from "@/components/admin/StatusBadge";
import { iconButtonClass } from "@/components/admin/styles";
import { formatDate } from "./format";

function VisibilityBadge({ faq }: { faq: FaqRow }) {
  return (
    <StatusBadge
      tone={faq.isActive ? "success" : "neutral"}
      className="transition-[filter] hover:brightness-95"
    >
      {faq.isActive ? "Visible" : "Hidden"}
      {faq.isActive ? (
        <Eye className="size-3.5" aria-hidden="true" />
      ) : (
        <EyeOff className="size-3.5" aria-hidden="true" />
      )}
    </StatusBadge>
  );
}

const questionColumn: Column<FaqRow, FaqSortKey> = {
  id: "question",
  header: "Question",
  sortKey: "question",
  cell: (faq) => (
    <div className="flex max-w-xl flex-col gap-0.5">
      <span className="font-semibold text-ink">{faq.question}</span>
      <span className="line-clamp-1 text-xs text-gray-2">{faq.answer}</span>
    </div>
  ),
};

const sortOrderColumn: Column<FaqRow, FaqSortKey> = {
  id: "sortOrder",
  header: "Order",
  sortKey: "sortOrder",
  align: "right",
  hideBelow: "sm",
  cell: (faq) => <span className="tabular-nums">{faq.sortOrder}</span>,
};

const updatedColumn: Column<FaqRow, FaqSortKey> = {
  id: "updatedAt",
  header: "Updated",
  sortKey: "updatedAt",
  hideBelow: "lg",
  cell: (faq) => (
    <time dateTime={faq.updatedAt.toISOString()} className="whitespace-nowrap">
      {formatDate(faq.updatedAt)}
    </time>
  ),
};

const editColumns: Column<FaqRow, FaqSortKey>[] = [
  questionColumn,
  sortOrderColumn,
  {
    id: "status",
    header: "Status",
    sortKey: "status",
    cell: (faq) => (
      <form action={toggleFaqActive.bind(null, faq.id)}>
        <button
          type="submit"
          title={faq.isActive ? "Click to hide on the site" : "Click to show on the site"}
          className="rounded-full transition-transform focus-visible:ring-2 focus-visible:ring-primary focus-visible:outline-none active:scale-95"
        >
          <VisibilityBadge faq={faq} />
        </button>
      </form>
    ),
  },
  updatedColumn,
  {
    id: "actions",
    header: "Actions",
    hideHeader: true,
    align: "right",
    className: "w-px py-2",
    cell: (faq) => (
      <div className="flex justify-end gap-1">
        <Link
          href={`/admin/faqs/${faq.id}/edit`}
          aria-label={`Edit "${faq.question}"`}
          title="Edit"
          className={iconButtonClass}
        >
          <Pencil aria-hidden="true" />
        </Link>
        <DeleteButton
          action={deleteFaq.bind(null, faq.id)}
          title="Delete this FAQ?"
          description={
            <>
              <strong>{faq.question}</strong> will be permanently removed from the site.
            </>
          }
          label={`Delete "${faq.question}"`}
          successMessage="FAQ deleted."
        />
      </div>
    ),
  },
];

// Read-only roles see the status as a plain badge and get no Actions column.
const viewColumns: Column<FaqRow, FaqSortKey>[] = [
  questionColumn,
  sortOrderColumn,
  {
    id: "status",
    header: "Status",
    sortKey: "status",
    cell: (faq) => <VisibilityBadge faq={faq} />,
  },
  updatedColumn,
];

export default async function FaqsTable({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const params = parseListParams(await searchParams, FAQ_SORT_KEYS);
  const { rows, ...pageInfo } = await listFaqs(params);
  const canEdit = await viewerCanEdit();

  return (
    <DataTable
      caption="FAQs"
      columns={canEdit ? editColumns : viewColumns}
      rows={rows}
      getRowKey={(faq) => faq.id}
      pagination={{ ...pageInfo, itemLabel: "FAQs" }}
      empty={
        params.q ? (
          <EmptyState
            icon={SearchX}
            title={`No FAQs match “${params.q}”`}
            description="Try different words from the question or answer."
          />
        ) : (
          <EmptyState
            title="No FAQs yet"
            description="Add the questions visitors ask most to show them on the site."
          />
        )
      }
    />
  );
}
