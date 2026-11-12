import 'server-only';
import { redirect } from 'next/navigation';
import { prisma } from '@/lib/prisma';
import { requirePanelUser, type PanelUser } from '@/lib/admin/auth';
import { applicationScope, isClientUser, scoped } from '@/lib/admin/scope';
import { canEdit } from '@/lib/auth/roles';

/**
 * Who may run the interview and the hiring decision on one application:
 * admins, and the client's own users for applications submitted to them.
 * Viewers and everyone else are sent back to the dashboard, like requireAdmin.
 */
export async function requireApplicationManager(applicationId: string): Promise<PanelUser> {
  const user = await requirePanelUser();
  if (canEdit(user.role)) return user;
  if (isClientUser(user) && typeof applicationId === 'string') {
    const visible = await prisma.jobApplication.count({ where: scoped(applicationScope(user), { id: applicationId }) });
    if (visible) return user;
  }
  redirect('/admin');
}
