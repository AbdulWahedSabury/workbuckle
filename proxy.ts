import type { NextFetchEvent, NextRequest } from 'next/server';
import NextAuth from 'next-auth';
import createIntlMiddleware from 'next-intl/middleware';
import { authConfig } from '@/auth.config';
import { routing } from '@/i18n/routing';

// Next 16 renamed middleware.ts to proxy.ts; only one is allowed, so it routes
// each request to one of two handlers.

// Admin panel: an optimistic check from the JWT cookie only. Pages and Server
// Actions re-verify against the database through requireAdmin() (lib/admin/auth.ts).
// authConfig.callbacks.authorized decides; the wrapped handler only runs when it
// lets the request through, and returning nothing continues to the page.
// (The explicit parameter types select auth()'s middleware overload.)
const continueToPage = (_request: NextRequest, _event: NextFetchEvent) => undefined;
const adminProxy = NextAuth(authConfig).auth(continueToPage);

// Public site: picks the language from the URL prefix (/el/...), the
// NEXT_LOCALE cookie or Accept-Language, and rewrites to app/[locale]/.
const intlProxy = createIntlMiddleware(routing);

function isAdminPath(pathname: string): boolean {
  return pathname === '/admin' || pathname.startsWith('/admin/');
}

export default function proxy(request: NextRequest, event: NextFetchEvent) {
  if (isAdminPath(request.nextUrl.pathname)) return adminProxy(request, event);
  return intlProxy(request);
}

export const config = {
  // Everything except API routes, Next internals and files with an extension
  // (images, favicon, robots.txt, ...).
  matcher: ['/((?!api|_next|_vercel|.*\\..*).*)'],
};
