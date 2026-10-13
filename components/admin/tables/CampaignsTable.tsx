import Link from "next/link";
import { ImageOff, Pencil, SearchX } from "lucide-react";
import { deleteCampaign } from "@/lib/admin/actions/campaigns";
import { parseListParams } from "@/lib/admin/list-params";
import {
  CAMPAIGN_SORT_KEYS,
  listCampaigns,
  type CampaignSortKey,
  type CampaignWithCount,
} from "@/lib/admin/queries";
import { DataTable, type Column } from "@/components/admin/data-table";
import { DeleteButton } from "@/components/admin/buttons";
import { viewerCanEdit } from "@/lib/admin/auth";
import EmptyState from "@/components/admin/EmptyState";
import StatusBadge from "@/components/admin/StatusBadge";
import { iconButtonClass } from "@/components/admin/styles";
import { formatDate } from "./format";

const columns: Column<CampaignWithCount, CampaignSortKey>[] = [
  {
    id: "title",
    header: "Campaign",
    sortKey: "title",
    cell: (campaign) => (
      <div className="flex items-center gap-3">
        {campaign.img ? (
          // eslint-disable-next-line @next/next/no-img-element -- arbitrary admin-entered hosts
          <img
            src={campaign.img}
            alt=""
            className="h-10 w-16 shrink-0 rounded-xl border border-line bg-gray-3 object-cover"
          />
        ) : (
          <span className="flex h-10 w-16 shrink-0 items-center justify-center rounded-xl bg-gray-3 text-gray-2/70">
            <ImageOff className="size-4" aria-hidden="true" />
          </span>
        )}
        <div className="min-w-0">
          <p className="font-semibold text-ink">{campaign.title}</p>
          <p className="line-clamp-1 max-w-md text-xs text-gray-2">{campaign.intro}</p>
        </div>
      </div>
    ),
  },
  {
    id: "jobs",
    header: "Jobs",
    sortKey: "jobs",
    cell: (campaign) =>
      campaign._count.jobs > 0 ? (
        <StatusBadge tone="brand" dot={false}>
          {campaign._count.jobs} {campaign._count.jobs === 1 ? "job" : "jobs"}
        </StatusBadge>
      ) : (
        <span className="text-gray-2/60">No jobs</span>
      ),
  },
  {
    id: "updatedAt",
    header: "Updated",
    sortKey: "updatedAt",
    hideBelow: "lg",
    cell: (campaign) => (
      <time dateTime={campaign.updatedAt.toISOString()} className="whitespace-nowrap">
        {formatDate(campaign.updatedAt)}
      </time>
    ),
  },
  {
    id: "actions",
    header: "Actions",
    hideHeader: true,
    align: "right",
    className: "w-px py-2",
    cell: (campaign) => (
      <div className="flex justify-end gap-1">
        <Link
          href={`/admin/campaigns/${campaign.id}/edit`}
          aria-label={`Edit ${campaign.title}`}
          title="Edit"
          className={iconButtonClass}
        >
          <Pencil aria-hidden="true" />
        </Link>
        <DeleteButton
          action={deleteCampaign.bind(null, campaign.id)}
          title="Delete this campaign?"
          description={
            <>
              <strong>{campaign.title}</strong> will be permanently deleted.
              {campaign._count.jobs > 0 &&
                ` Its ${campaign._count.jobs === 1 ? "job stays" : `${campaign._count.jobs} jobs stay`}, without a campaign.`}
            </>
          }
          label={`Delete ${campaign.title}`}
          successMessage="Campaign deleted."
        />
      </div>
    ),
  },
];

export default async function CampaignsTable({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const params = parseListParams(await searchParams, CAMPAIGN_SORT_KEYS);
  const { rows, ...pageInfo } = await listCampaigns(params);
  const canEdit = await viewerCanEdit();

  return (
    <DataTable
      caption="Campaigns"
      // Read-only roles get no Actions column: it only holds edit/delete.
      columns={canEdit ? columns : columns.filter((c) => c.id !== "actions")}
      rows={rows}
      getRowKey={(campaign) => campaign.id}
      pagination={{ ...pageInfo, itemLabel: "campaigns" }}
      empty={
        params.q ? (
          <EmptyState
            icon={SearchX}
            title={`No campaigns match “${params.q}”`}
            description="Search looks at titles and intros."
          />
        ) : (
          <EmptyState
            title="No campaigns yet"
            description="Campaigns group related jobs under one image and intro."
          />
        )
      }
    />
  );
}
