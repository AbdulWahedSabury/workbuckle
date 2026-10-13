import { Suspense, type ReactNode } from "react";
import { getLocale, getTranslations } from "next-intl/server";
import FadeUp from "@/components/motion/FadeUp";
import RevealSection from "@/components/motion/RevealSection";
import CtaButton from "@/components/ui/CtaButton";
import SectionHeader from "@/components/ui/SectionHeader";
import JobsFeedList from "@/components/jobs/JobsFeedList";
import { JobsLoadingState } from "@/components/jobs/JobsLoadingState";
import { JobsQueryProvider } from "@/components/jobs/JobsQueryProvider";
import LocationChips from "@/components/jobs/LocationChips";
import type { Paginated } from "@/lib/admin/list-params";
import {
  EMPTY_JOBS_PARAMS,
  parseJobsParams,
  writeJobsParams,
  type JobsListParams,
} from "@/lib/jobs/jobs-params";
import { listPublicCities, listPublishedJobsPage } from "@/lib/jobs/public-jobs";
import type { CityOption, PublicJobSummary } from "@/types/job";

const FEATURED_COUNT = 10;

type SearchParams = Promise<Record<string, string | string[] | undefined>>;

/**
 * The home page's latest jobs, filtered by city through the URL
 * (`/?location=<city-slug>`) like the /jobs page. The rest of the home page
 * renders straight away; the board streams in behind <Suspense>.
 */
export default function JobBoard({ searchParams }: { searchParams: SearchParams }) {
  return (
    <RevealSection id="jobs" className="section-spacing">
      <div className="container-site">
        <Suspense fallback={<JobBoardFallback />}>
          <JobBoardContent searchParams={searchParams} />
        </Suspense>
      </div>
    </RevealSection>
  );
}

async function JobBoardContent({ searchParams }: { searchParams: SearchParams }) {
  // Only the city applies here; search, type and paging belong to /jobs.
  const { location } = parseJobsParams(await searchParams);
  const params: JobsListParams = { ...EMPTY_JOBS_PARAMS, location };
  const locale = await getLocale();

  let result: Paginated<PublicJobSummary> | null = null;
  let cities: CityOption[] = [];
  try {
    [result, cities] = await Promise.all([
      listPublishedJobsPage(params, locale, FEATURED_COUNT),
      listPublicCities(params),
    ]);
  } catch (error) {
    console.error("Failed to list featured jobs:", error);
  }

  // "View all" carries the city over to the full list.
  const query = writeJobsParams(params).toString();

  return (
    <JobsQueryProvider params={params}>
      <BoardHeader>
        <LocationChips cities={cities} className="mb-8 sm:mb-10 lg:mb-12 lg:max-w-[55%]" />
      </BoardHeader>

      <JobsFeedList jobs={result?.rows ?? []} isError={!result} />

      {result && result.total > 0 && (
        <FadeUp className="mt-10 flex justify-center">
          <CtaButton href={query ? `/jobs?${query}` : "/jobs"}>
            View all {result.total} {result.total === 1 ? "job" : "jobs"}
          </CtaButton>
        </FadeUp>
      )}
    </JobsQueryProvider>
  );
}

function JobBoardFallback() {
  return (
    <>
      <BoardHeader />
      <JobsLoadingState />
    </>
  );
}

/** Section title with the location chips (when given) beside it from lg up. */
async function BoardHeader({ children }: { children?: ReactNode }) {
  const t = await getTranslations("pages.home.featured_jobs");
  return (
    <div className="flex flex-col gap-2 lg:flex-row lg:items-end lg:justify-between">
      <SectionHeader eyebrow={t("eyebrow")} title={t("title")} description="" />
      {children}
    </div>
  );
}
