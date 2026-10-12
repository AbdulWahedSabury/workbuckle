import { NextResponse, type NextRequest } from "next/server";
import { hasLocale } from "next-intl";
import { listPublishedJobs } from "@/lib/jobs/public-jobs";
import { defaultLocale, locales } from "@/types/locale";

const MAX_SEARCH_LENGTH = 100;

/** Published jobs for the public job board: GET /api/jobs?search=<text>&locale=<en|de>. */
export async function GET(request: NextRequest) {
  const params = request.nextUrl.searchParams;
  const search = (params.get("search") ?? "").trim().slice(0, MAX_SEARCH_LENGTH);
  const requested = params.get("locale");
  const locale = hasLocale(locales, requested) ? requested : defaultLocale;

  try {
    const jobs = await listPublishedJobs({ search, locale });
    return NextResponse.json({ jobs });
  } catch (error) {
    console.error("Failed to list jobs:", error);
    return NextResponse.json({ message: "Could not load jobs." }, { status: 500 });
  }
}
