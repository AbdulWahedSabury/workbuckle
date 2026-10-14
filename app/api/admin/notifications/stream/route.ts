import type { NextRequest } from 'next/server';
import { getPanelUser } from '@/lib/admin/auth';
import { canView } from '@/lib/auth/roles';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

const POLL_MS = 3000;

/**
 * Server-Sent Events feed of unread admin notifications. Polls the table and
 * sends the latest unread list whenever it changes; the client
 * (AdminNotificationsProvider) diffs ids to decide what's new. proxy.ts only
 * matches /admin/*, so this route checks the session itself.
 */
export async function GET(request: NextRequest) {
  const user = await getPanelUser();
  if (!user || !canView(user.role, 'candidates')) {
    return new Response('Unauthorized', { status: 401 });
  }

  const encoder = new TextEncoder();

  const stream = new ReadableStream({
    async start(controller) {
      // A comment line opens the stream right away.
      controller.enqueue(encoder.encode(':\n\n'));

      let lastPayload = '';
      while (!request.signal.aborted) {
        try {
          const unread = await prisma.adminNotification.findMany({
            where: { isRead: false },
            orderBy: { createdAt: 'desc' },
            take: 10,
            select: { id: true, title: true, message: true, type: true, link: true, createdAt: true },
          });
          const payload = JSON.stringify(unread);
          // Always send the first payload so the client can seed what it has seen.
          if (payload !== lastPayload) {
            controller.enqueue(encoder.encode(`data: ${payload}\n\n`));
            lastPayload = payload;
          } else {
            // Keep-alive so proxies don't drop an idle connection.
            controller.enqueue(encoder.encode(':\n\n'));
          }
        } catch (error) {
          if (request.signal.aborted) break;
          console.error('Admin notification stream query failed:', error);
        }
        await new Promise((resolve) => setTimeout(resolve, POLL_MS));
      }

      try {
        controller.close();
      } catch {
        // Already closed by the client disconnecting.
      }
    },
  });

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream; charset=utf-8',
      'Cache-Control': 'no-cache, no-transform',
      Connection: 'keep-alive',
      // Stops Nginx/Vercel from buffering events.
      'X-Accel-Buffering': 'no',
    },
  });
}
