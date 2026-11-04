import { NextResponse, type NextRequest } from "next/server";
import { getCandidateCv } from "@/lib/admin/queries";
import { cvObjectPath, getCvSignedUrl } from "@/lib/cv-storage";

/** Sends a signed-in viewer to a short-lived link to the CV, so the bucket can stay private. */
export async function GET(_req: NextRequest, ctx: RouteContext<"/admin/candidates/[id]/cv">) {
  const { id } = await ctx.params;
  // Redirects to the login page or dashboard without access to candidates.
  const candidate = await getCandidateCv(id);
  const path = candidate && cvObjectPath(candidate);
  if (!path) return new NextResponse("CV not found", { status: 404 });

  try {
    const response = NextResponse.redirect(await getCvSignedUrl(path));
    response.headers.set("Cache-Control", "no-store");
    return response;
  } catch (error) {
    console.error("Failed to sign CV link:", error);
    return new NextResponse("CV not found", { status: 404 });
  }
}
