import { NextResponse, type NextRequest } from 'next/server';
import { listPublicCategories, listPublicCities, listPublicJobTypes, listPublishedJobsPage } from '@/lib/jobs/public-jobs';
import { parseJobsParams } from '@/lib/jobs/jobs-params';
import { defaultLocale, locales, type Locale } from '@/types/locale';
import type { ApiResponse } from '@/types/response';
import { getCorsHeaders } from '@/utils/cors';

const METHODS = 'GET, OPTIONS';

export async function OPTIONS(req: NextRequest) {
  return new Response(null, { status: 204, headers: getCorsHeaders(req.headers.get('origin'), METHODS) });
}

/** Published jobs and their public filters for the Mavromatis jobs site. */
export async function GET(req: NextRequest) {
  const headers = getCorsHeaders(req.headers.get('origin'), METHODS);
  const searchParams = req.nextUrl.searchParams;
  const params = parseJobsParams(Object.fromEntries(searchParams.entries()));
  const requestedLocale = searchParams.get('locale');
  const locale: Locale = locales.includes(requestedLocale as Locale)
    ? (requestedLocale as Locale)
    : defaultLocale;

  const [page, cities, categories, jobTypes] = await Promise.all([
    listPublishedJobsPage(params, locale),
    listPublicCities(params),
    listPublicCategories(locale),
    listPublicJobTypes(locale),
  ]);

  const data = { ...page, cities, categories, jobTypes };
  return NextResponse.json<ApiResponse<typeof data>>({ data }, { headers });
}
