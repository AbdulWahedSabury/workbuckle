import { NextResponse, type NextRequest } from "next/server";
import { listPublicCampaigns } from "@/lib/campaigns/public-campaigns";
import type { CampaignPayload } from "@/types/campaign";
import type { ApiResponse } from "@/types/response";
import { getCorsHeaders } from "@/utils/cors";

const METHODS = "GET, OPTIONS";

export async function OPTIONS(req: NextRequest) {
  return new Response(null, { status: 204, headers: getCorsHeaders(req.headers.get("origin"), METHODS) });
}

/** Every campaign with its published jobs' titles. Writes go through the admin panel's Server Actions. */
export async function GET(req: NextRequest) {
  const headers = getCorsHeaders(req.headers.get("origin"), METHODS);
  const data = await listPublicCampaigns();
  return NextResponse.json<ApiResponse<CampaignPayload[]>>({ data }, { headers });
}
