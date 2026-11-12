'use server';

import { revalidatePath } from 'next/cache';
import { requireApplicationManager } from '@/lib/admin/application-access';
import { notifyAgencyOfClientAction } from '@/lib/admin/client-activity';
import type { DeleteResult } from '@/lib/admin/action-state';
import { HireRefused, hireApplication } from '@/lib/admin/hiring';
import { isClientUser } from '@/lib/admin/scope';

export type HireResult = DeleteResult & { message?: string };

/** The explicit hiring decision. Never triggered by an interview result on its own. */
export async function hireCandidate(applicationId: string): Promise<HireResult> {
  if (typeof applicationId !== 'string' || !applicationId) return { error: 'Invalid application.' };
  // Admins, or the client's own users on an application submitted to them.
  const user = await requireApplicationManager(applicationId);

  let outcome;
  try {
    outcome = await hireApplication(applicationId, user.id, isClientUser(user));
  } catch (error) {
    if (error instanceof HireRefused) return { error: error.message };
    throw error;
  }

  await notifyAgencyOfClientAction(user, {
    title: 'Client hired a candidate',
    message: `${outcome.candidateName} was hired for ${outcome.jobTitle}.`,
    link: `/admin/candidates/${applicationId}`,
  });
  revalidatePath('/admin/candidates', 'layout');
  revalidatePath('/admin/jobs');
  revalidatePath('/admin');

  const capacity = outcome.jobClosed
    ? 'All positions are filled; the job is now closed.'
    : `${outcome.remaining} ${outcome.remaining === 1 ? 'position' : 'positions'} left.`;
  const cancelled = outcome.cancelled
    ? ` ${outcome.cancelled} other ${outcome.cancelled === 1 ? 'application was' : 'applications were'} cancelled.`
    : '';
  return { message: `${outcome.candidateName} hired for ${outcome.jobTitle}. ${capacity}${cancelled}` };
}
