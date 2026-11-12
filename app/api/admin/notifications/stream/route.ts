import type { NextRequest } from 'next/server';
import { getPanelUser } from '@/lib/admin/auth';
import { canView } from '@/lib/auth/roles';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

// Each open admin tab holds one stream. At 10 s that is 6 small queries a minute
// per tab (was 40 at 3 s); a new notification shows within 10 s.
const POLL_MS = 10_000;
// A long-lived connection outlasts the session check below, so access is re-checked
// on this cadence: removing someone's access ends their stream within a minute.
const ROLE_CHECK_MS = 60_000;
// Ends each stream after a while; the browser's EventSource reconnects on its own
// (after RETRY_MS). Keeps connections and serverless functions from living forever.
const MAX_STREAM_MS = 5 * 60_000;
const RETRY_MS = 5_000;

const UNREAD = { isRead: false } as const;

/** Changes whenever a notification arrives or any are marked read; one indexed query. */
async function unreadFingerprint(): Promise<string> {
  const { _count, _max } = await prisma.adminNotification.aggregate({
    where: UNREAD,
    _count: { _all: true },
    _max: { createdAt: true },
  });
  return `${_count._all}:${_max.createdAt?.toISOString() ?? ''}`;
}

async function latestUnread(): Promise<string> {
  const unread = await prisma.adminNotification.findMany({
    where: UNREAD,
    orderBy: { createdAt: 'desc' },
    take: 10,
    select: { id: true, title: true, message: true, type: true, link: true, createdAt: true },
  });
  return JSON.stringify(unread);
}

/** Waits `ms`, or less if the client disconnects, so a closed tab frees the stream at once. */
function pause(ms: number, signal: AbortSignal): Promise<void> {
  return new Promise((resolve) => {
    const timer = setTimeout(resolve, ms);
    signal.addEventListener('abort', () => {
      clearTimeout(timer);
      resolve();
    }, { once: true });
  });
}

async function stillAllowed(userId: string): Promise<boolean> {
  const current = await prisma.user.findUnique({ where: { id: userId }, select: { role: true } });
  return Boolean(current && canView(current.role, 'notifications'));
}

/**
 * Server-Sent Events feed of unread admin notifications. Polls a cheap fingerprint
 * and sends the latest unread list only when it changed; the client
 * (AdminNotificationsProvider) diffs ids to decide what's new. proxy.ts only
 * matches /admin/*, so this route checks the session itself.
 */
export async function GET(request: NextRequest) {
  const user = await getPanelUser();
  if (!user || !canView(user.role, 'notifications')) {
    return new Response('Unauthorized', { status: 401 });
  }

  const encoder = new TextEncoder();
  const send = (controller: ReadableStreamDefaultController, text: string) => controller.enqueue(encoder.encode(text));

  const stream = new ReadableStream({
    async start(controller) {
      // Opens the stream right away and sets how soon the browser reconnects.
      send(controller, `retry: ${RETRY_MS}\n:\n\n`);

      const startedAt = Date.now();
      let lastRoleCheck = startedAt;
      let lastFingerprint: string | null = null;
      while (!request.signal.aborted && Date.now() - startedAt < MAX_STREAM_MS) {
        try {
          if (Date.now() - lastRoleCheck >= ROLE_CHECK_MS) {
            if (!(await stillAllowed(user.id))) break;
            lastRoleCheck = Date.now();
          }
          const fingerprint = await unreadFingerprint();
          // Always send the first list so the client can seed what it has seen.
          if (fingerprint !== lastFingerprint) {
            send(controller, `data: ${await latestUnread()}\n\n`);
            lastFingerprint = fingerprint;
          } else {
            // Keep-alive so proxies don't drop an idle connection.
            send(controller, ':\n\n');
          }
        } catch (error) {
          if (request.signal.aborted) break;
          console.error('Admin notification stream query failed:', error);
        }
        await pause(POLL_MS, request.signal);
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
