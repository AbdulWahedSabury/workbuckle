import type { NextAuthConfig } from 'next-auth';
import { Role } from '@/lib/generated/prisma/enums';
import { isPanelRole, isRole } from '@/lib/auth/roles';

export const ADMIN_LOGIN_PATH = '/admin/login';

/**
 * The part of the Auth.js config that proxy.ts can load: no Prisma, no
 * providers, only JWT callbacks. auth.ts spreads this and adds the adapter
 * and Credentials provider.
 */
export const authConfig = {
  pages: { signIn: ADMIN_LOGIN_PATH },
  // Credentials sign-in requires JWT sessions, even with an adapter.
  session: { strategy: 'jwt', maxAge: 8 * 60 * 60 },
  providers: [],
  callbacks: {
    jwt({ token, user }) {
      // `user` is only present on sign-in; copy what the session needs.
      if (user?.id) {
        token.id = user.id;
        token.role = user.role ?? Role.USER;
      }
      return token;
    },
    // JWT fields are `unknown` (augmenting @auth/core/jwt doesn't resolve
    // under pnpm), so narrow them here instead.
    session({ session, token }) {
      if (typeof token.id === 'string') session.user.id = token.id;
      session.user.role = isRole(token.role) ? token.role : Role.USER;
      return session;
    },
    // Runs in proxy.ts, which only matches /admin/*. Returning false sends
    // the visitor to pages.signIn with a callbackUrl. The login page is
    // always let through: it does its own DB-backed "already signed in"
    // redirect, which can't loop when a demoted admin still holds an ADMIN JWT.
    authorized({ auth, request: { nextUrl } }) {
      if (nextUrl.pathname === ADMIN_LOGIN_PATH) return true;
      // Any panel role gets in; per-section rules are enforced server-side.
      return isPanelRole(auth?.user?.role);
    },
  },
} satisfies NextAuthConfig;
