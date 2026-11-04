import { NextResponse } from 'next/server';
import { getPanelUser } from '@/lib/admin/auth';
import { canEdit } from '@/lib/auth/roles';
import { prisma } from '@/lib/prisma';

/** Marks every admin notification read. Read state is shared across the panel. */
export async function POST() {
  // proxy.ts doesn't match /api/*, so check the session here. Read state is
  // shared, so clearing it is a write: ADMIN only, like every other change.
  const user = await getPanelUser();
  if (!user || !canEdit(user.role)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    await prisma.adminNotification.updateMany({
      where: { isRead: false },
      data: { isRead: true },
    });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Failed to mark notifications as read:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
