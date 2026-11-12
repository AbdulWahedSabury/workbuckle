import { NextResponse, type NextRequest } from "next/server";
import { getPersonCv } from "@/lib/admin/queries";
import { cvObjectPath, getCvSignedUrl } from "@/lib/cv-storage";

/** A person's own CV, as a short-lived signed link. Admin and viewer only (getPersonCv checks). */
export async function GET(_req: NextRequest, ctx: RouteContext<"/admin/people/[id]/cv">) {
  const { id } = await ctx.params;
  const person = await getPersonCv(id);
  const path = person && cvObjectPath(person);
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
