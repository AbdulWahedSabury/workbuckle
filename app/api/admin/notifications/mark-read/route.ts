import { NextResponse } from 'next/server';
import { getPanelUser } from '@/lib/admin/auth';
import { canView } from '@/lib/auth/roles';
import { prisma } from '@/lib/prisma';

/** Marks every admin notification read. Read state is shared across the panel. */
export async function POST() {
  // proxy.ts doesn't match /api/*, so check the session here.
  const user = await getPanelUser();
  if (!user || !canView(user.role, 'candidates')) {
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
