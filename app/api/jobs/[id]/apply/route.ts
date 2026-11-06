import { NextResponse, type NextRequest } from 'next/server';
import { submitPublicApplication } from '@/lib/jobs/submit-application';
import type { ApiResponse } from '@/types/response';
import { getCorsHeaders } from '@/utils/cors';

const METHODS = 'POST, OPTIONS';

export async function OPTIONS(req: NextRequest) {
  return new Response(null, { status: 204, headers: getCorsHeaders(req.headers.get('origin'), METHODS) });
}

/** Receives the public multipart application form and stores the candidate in Workbuckle. */
export async function POST(req: NextRequest, ctx: RouteContext<'/api/jobs/[id]/apply'>) {
  const headers = getCorsHeaders(req.headers.get('origin'), METHODS);
  const { id } = await ctx.params;

  let formData: FormData;
  try {
    formData = await req.formData();
  } catch {
    return NextResponse.json<ApiResponse<{ ok: false; message: string }>>(
      { data: { ok: false, message: 'Could not read the application form.' } },
      { status: 400, headers },
    );
  }

  try {
    const result = await submitPublicApplication(id, formData, req.headers);
    return NextResponse.json<ApiResponse<typeof result>>(
      { data: result },
      { status: result.ok ? 200 : 400, headers },
    );
  } catch (error) {
    console.error('Public job application failed:', error);
    return NextResponse.json<ApiResponse<{ ok: false; message: string }>>(
      { data: { ok: false, message: 'We could not submit your application. Please try again.' } },
      { status: 500, headers },
    );
  }
}
