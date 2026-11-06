import type { ReactNode } from "react";
import { useTranslations } from "next-intl";
import { getLocale, getTranslations } from "next-intl/server";
import SectionHeader from "@/components/ui/SectionHeader";
import JobsFeedList from "@/components/jobs/JobsFeedList";
import JobsFilters from "@/components/jobs/JobsFilters";
import { JobsLoadingState } from "@/components/jobs/JobsLoadingState";
import JobsPagination from "@/components/jobs/JobsPagination";
import { getCampaignSummary } from "@/lib/campaigns/public-campaigns";
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
  const [locale, t] = await Promise.all([getLocale(), getTranslations("jobs.feed")]);

  let result: Paginated<PublicJobSummary> | null = null;
  let cities: CityOption[] = [];
  let jobTypes: JobTypeOption[] = [];
  let categories: CategoryOption[] = [];
  let campaignTitle: string | null = null;
  try {
    let campaign;
    [result, cities, jobTypes, categories, campaign] = await Promise.all([
      listPublishedJobsPage(params, locale),
      listPublicCities(params),
      listPublicJobTypes(locale),
      listPublicCategories(locale),
      params.campaign ? getCampaignSummary(params.campaign, locale) : null,
    ]);
    campaignTitle = campaign?.title ?? null;
  } catch (error) {
    console.error("Failed to list jobs:", error);
  }

  const total = result?.total ?? 0;
  const title = result ? t("count", { count: total }) : t("fallback_title");

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
  const t = useTranslations("jobs.feed");
  return (
    <>
      <FeedHeader title={t("loading_title")} />
      <div className="mt-8">
        <JobsLoadingState />
      </div>
    </>
  );
}

/** Title with the filter bar (when given) underneath, full width. */
function FeedHeader({ title, children }: { title: string; children?: ReactNode }) {
  const t = useTranslations("jobs.feed");
  return (
    <div>
      <div aria-live="polite">
        <SectionHeader eyebrow={t("eyebrow")} title={title} description="" />
      </div>
      {children}
    </div>
  );
}
