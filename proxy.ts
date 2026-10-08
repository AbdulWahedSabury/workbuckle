import NextAuth from 'next-auth';
import { authConfig } from '@/auth.config';

// Next 16 renamed middleware.ts to proxy.ts. This is an optimistic check
// from the JWT cookie only; pages and Server Actions re-verify against the
// database through requireAdmin() (lib/admin/auth.ts).
export default NextAuth(authConfig).auth;

// Only the admin panel. Public routes never run this file.
export const config = {
  matcher: ['/admin/:path*'],
};
