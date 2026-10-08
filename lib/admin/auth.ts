import 'server-only';
import { cache } from 'react';
import { redirect } from 'next/navigation';
import { auth } from '@/auth';
import { ADMIN_LOGIN_PATH } from '@/auth.config';
import { canEdit, canView, isPanelRole, type AdminSection } from '@/lib/auth/roles';
import { prisma } from '@/lib/prisma';

/**
 * The signed-in panel user (any role that may open /admin), or null. Reads
 * the role from the database rather than trusting the JWT, so role changes
 * and removals take effect immediately instead of when the token expires.
 * Cached per request.
 */
export const getPanelUser = cache(async () => {
  const session = await auth();
  const userId = session?.user?.id;
  if (!userId) return null;

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { id: true, email: true, name: true, role: true },
  });
  return user && isPanelRole(user.role) ? user : null;
});

export type PanelUser = NonNullable<Awaited<ReturnType<typeof getPanelUser>>>;

/** Signed in with panel access, else to the login page. */
export async function requirePanelUser(): Promise<PanelUser> {
  const user = await getPanelUser();
  if (!user) redirect(ADMIN_LOGIN_PATH);
  return user;
}

/**
 * Read access to one section. Used by queries, so a role can't load data
 * for a section it can't open. Every panel role can view the dashboard, so
 * redirecting there can't loop.
 */
export async function requireView(section: AdminSection): Promise<PanelUser> {
  const user = await requirePanelUser();
  if (!canView(user.role, section)) redirect('/admin');
  return user;
}

/**
 * Write access: ADMIN only. Every admin Server Action and create/edit page
 * calls this; proxy.ts and the layout are only the first lines.
 */
export async function requireAdmin(): Promise<PanelUser> {
  const user = await requirePanelUser();
  if (!canEdit(user.role)) redirect('/admin');
  return user;
}

/** For hiding write controls in Server Components. */
export async function viewerCanEdit(): Promise<boolean> {
  const user = await getPanelUser();
  return user ? canEdit(user.role) : false;
}
