import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import PageHeader from "@/components/admin/PageHeader";
import CampaignForm from "@/components/admin/CampaignForm";
import StatusBadge from "@/components/admin/StatusBadge";
import { cardClass } from "@/components/admin/styles";
import { STATUS_BADGE } from "@/components/admin/tables/JobsTable";
import { updateCampaign } from "@/lib/admin/actions/campaigns";
import { requireAdmin } from "@/lib/admin/auth";
import { getCampaign } from "@/lib/admin/queries";

export const metadata: Metadata = { title: "Edit campaign" };

export default async function EditCampaignPage({
  params,
}: PageProps<"/admin/campaigns/[id]/edit">) {
  await requireAdmin();
  const { id } = await params;
  const campaign = await getCampaign(id);
  if (!campaign) notFound();

  return (
    <>
      <PageHeader title="Edit campaign" description={campaign.title} />
      <div className="grid items-start gap-6 lg:grid-cols-[minmax(0,42rem)_20rem]">
        <CampaignForm
          action={updateCampaign.bind(null, campaign.id)}
          campaign={{
            title: campaign.title,
            img: campaign.img,
            imageAlt: campaign.imageAlt,
            intro: campaign.intro,
          }}
          submitLabel="Save changes"
        />

        <section aria-labelledby="campaign-jobs" className={`${cardClass} p-5 sm:p-6 lg:sticky lg:top-6`}>
          <h2 id="campaign-jobs" className="font-heading text-base font-semibold text-ink">
            Jobs in this campaign
          </h2>
          <p className="mt-1 text-xs text-gray-2">
            Only published jobs are listed on the site. Add or remove jobs from each job&rsquo;s
            edit form.
          </p>
          {campaign.jobs.length ? (
            <ul className="mt-4 flex flex-col divide-y divide-line">
              {campaign.jobs.map((job) => {
                const badge = STATUS_BADGE[job.status] ?? { tone: "neutral" as const, label: job.status };
                return (
                  <li key={job.id} className="flex items-center justify-between gap-3 py-2.5">
                    <Link
                      href={`/admin/jobs/${job.id}/edit`}
                      className="min-w-0 truncate text-sm font-semibold text-ink underline-offset-2 hover:underline"
                    >
                      {job.title}
                    </Link>
                    <StatusBadge tone={badge.tone}>{badge.label}</StatusBadge>
                  </li>
                );
              })}
            </ul>
          ) : (
            <p className="mt-4 text-sm text-gray-2">No jobs assigned yet.</p>
          )}
        </section>
      </div>
    </>
  );
}
