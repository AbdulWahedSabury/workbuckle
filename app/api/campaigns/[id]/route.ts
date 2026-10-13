import { NextResponse, type NextRequest } from "next/server";
import { getPublicCampaign } from "@/lib/campaigns/public-campaigns";
import type { CampaignPayload } from "@/types/campaign";
import type { ApiResponse } from "@/types/response";
import { getCorsHeaders } from "@/utils/cors";

const METHODS = "GET, OPTIONS";

export async function OPTIONS(req: NextRequest) {
  return new Response(null, { status: 204, headers: getCorsHeaders(req.headers.get("origin"), METHODS) });
}

/** One campaign with its published jobs' titles; 404 for an unknown or malformed id. */
export async function GET(req: NextRequest, ctx: RouteContext<"/api/campaigns/[id]">) {
  const headers = getCorsHeaders(req.headers.get("origin"), METHODS);
  const { id } = await ctx.params;
  const campaign = await getPublicCampaign(id);
  if (!campaign) {
    return NextResponse.json<ApiResponse<null>>(
      { message: "Campaign not found", data: null },
      { status: 404, headers },
    );
  }
  return NextResponse.json<ApiResponse<CampaignPayload>>({ data: campaign }, { headers });
}
