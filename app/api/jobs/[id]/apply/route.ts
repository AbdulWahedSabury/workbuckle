import { NextResponse, type NextRequest } from 'next/server';
import { submitPublicApplication } from '@/lib/jobs/submit-application';
import type { ApiResponse } from '@/types/response';
import { getCorsHeaders } from '@/utils/cors';

const METHODS = 'POST, OPTIONS';

/** The CV limit is 10 MB (cvFileSchema); the rest of the form is small. Same cap as Server Actions (next.config.ts). */
const MAX_BODY_BYTES = 11 * 1024 * 1024;

// CV upload, storage and the notification can outlast a short default; CV indexing then runs in after().
export const maxDuration = 60;

export async function OPTIONS(req: NextRequest) {
  return new Response(null, { status: 204, headers: getCorsHeaders(req.headers.get('origin'), METHODS) });
}

/** Receives the public multipart application form and stores the candidate in Workbuckle. */
export async function POST(req: NextRequest, ctx: RouteContext<'/api/jobs/[id]/apply'>) {
  const headers = getCorsHeaders(req.headers.get('origin'), METHODS);
  const { id } = await ctx.params;

  // Checked before the body is read, so an oversized upload is never buffered in memory.
  const declared = Number(req.headers.get('content-length'));
  if (!Number.isFinite(declared) || declared <= 0 || declared > MAX_BODY_BYTES) {
    return NextResponse.json<ApiResponse<{ ok: false; message: string }>>(
      { data: { ok: false, message: 'The application is too large. The CV can be up to 10 MB.' } },
      { status: 413, headers },
    );
  }

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
