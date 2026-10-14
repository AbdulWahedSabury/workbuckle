// Not 'use server': that would let any visitor call this and post alerts into
// the panel. Only server code (e.g. submitApplication) may create notifications.
import 'server-only';
import { prisma } from '@/lib/prisma';
import type { NotificationType } from '@/lib/generated/prisma/enums';

/**
 * Records a panel-wide alert. The admin stream picks it up within a few
 * seconds and plays the alert sound + toast. Never throws: a failed alert
 * must not fail the action that triggered it.
 */
export async function createAdminNotification(input: {
  title: string;
  message: string;
  type?: NotificationType;
  link?: string;
}) {
  try {
    return await prisma.adminNotification.create({ data: input });
  } catch (error) {
    console.error('Failed to create admin notification:', error);
    return null;
  }
}
