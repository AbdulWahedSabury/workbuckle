import type { ReactNode } from "react";
import { getLocale } from "next-intl/server";
import SectionHeader from "@/components/ui/SectionHeader";
import JobsFeedList from "@/components/jobs/JobsFeedList";
import JobsFilters from "@/components/jobs/JobsFilters";
import { JobsLoadingState } from "@/components/jobs/JobsLoadingState";
import JobsPagination from "@/components/jobs/JobsPagination";
import { getCampaignTitle } from "@/lib/campaigns/public-campaigns";
import type { JobsListParams } from "@/lib/jobs/jobs-params";
import {
  listPublicCategories,
  listPublicCities,
  listPublicJobTypes,
  listPublishedJobsPage,
} from "@/lib/jobs/public-jobs";
import type { Paginated } from "@/lib/admin/list-params";
import type { CategoryOption, CityOption, JobTypeOption, PublicJobSummary } from "@/types/job";

/** Header, filters, rows and pagination for one page of published jobs (Server Component). */
export default async function JobsFeed({ params }: { params: JobsListParams }) {
  const locale = await getLocale();

  let result: Paginated<PublicJobSummary> | null = null;
  let cities: CityOption[] = [];
  let jobTypes: JobTypeOption[] = [];
  let categories: CategoryOption[] = [];
  let campaignTitle: string | null = null;
  try {
    [result, cities, jobTypes, categories, campaignTitle] = await Promise.all([
      listPublishedJobsPage(params, locale),
      listPublicCities(params),
      listPublicJobTypes(),
      listPublicCategories(locale),
      params.campaign ? getCampaignTitle(params.campaign) : null,
    ]);
  } catch (error) {
    console.error("Failed to list jobs:", error);
  }

  const total = result?.total ?? 0;
  const title = result ? `${total} open ${total === 1 ? "role" : "roles"}` : "Open roles";

  return (
    <>
      <FeedHeader title={title}>
        <JobsFilters
          cities={cities}
          jobTypes={jobTypes}
          categories={categories}
          campaignTitle={campaignTitle}
        />
      </FeedHeader>
      <JobsFeedList jobs={result?.rows ?? []} isError={!result} />
      {result && <JobsPagination page={result.page} pageCount={result.pageCount} />}
    </>
  );
}

/** First-load placeholder while the feed streams in. */
export function JobsFeedFallback() {
  return (
    <>
      <FeedHeader title="Loading roles…" />
      <div className="mt-8">
        <JobsLoadingState />
      </div>
    </>
  );
}

/** Title with the filter bar (when given) underneath, full width. */
function FeedHeader({ title, children }: { title: string; children?: ReactNode }) {
  return (
    <div>
      <div aria-live="polite">
        <SectionHeader eyebrow="Job Feed" title={title} description="" />
      </div>
      {children}
    </div>
  );
}
