import 'server-only';
import { createAdminNotification } from '@/lib/admin/actions/notifications';
import type { PanelUser } from '@/lib/admin/auth';
import { isClientUser } from '@/lib/admin/scope';

/** When a client user records an interview or a decision, the agency's panel gets an alert. */
export async function notifyAgencyOfClientAction(
  user: PanelUser,
  alert: { title: string; message: string; link: string }
): Promise<void> {
  if (!isClientUser(user)) return;
  await createAdminNotification({ ...alert, message: `${user.name ?? user.email}: ${alert.message}`, type: 'INFO' });
}
