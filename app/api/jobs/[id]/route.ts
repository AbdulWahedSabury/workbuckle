import { NextResponse, type NextRequest } from 'next/server';
import { getPublishedJob } from '@/lib/jobs/public-jobs';
import { defaultLocale, locales, type Locale } from '@/types/locale';
import type { ApiResponse } from '@/types/response';
import { getCorsHeaders } from '@/utils/cors';

const METHODS = 'GET, OPTIONS';

export async function OPTIONS(req: NextRequest) {
  return new Response(null, { status: 204, headers: getCorsHeaders(req.headers.get('origin'), METHODS) });
}

/** A single published job with sanitized rich text. */
export async function GET(req: NextRequest, ctx: RouteContext<'/api/jobs/[id]'>) {
  const headers = getCorsHeaders(req.headers.get('origin'), METHODS);
  const { id } = await ctx.params;
  const requestedLocale = req.nextUrl.searchParams.get('locale');
  const locale: Locale = locales.includes(requestedLocale as Locale)
    ? (requestedLocale as Locale)
    : defaultLocale;
  const job = await getPublishedJob(id, locale);

  if (!job) {
    return NextResponse.json<ApiResponse<null>>(
      { message: 'Job not found', data: null },
      { status: 404, headers },
    );
  }
  return NextResponse.json<ApiResponse<typeof job>>({ data: job }, { headers });
}
