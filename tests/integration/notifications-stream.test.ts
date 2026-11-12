// The admin notification stream (Server-Sent Events): what it sends first, who may
// open it, and that a disconnect frees it at once instead of after the next poll.
import { afterAll, beforeEach, describe, expect, it } from 'vitest';
import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { GET } from '@/app/api/admin/notifications/stream/route';
import { actAsClientUser } from '../setup/integration-mocks';
import { resetDatabase } from './helpers';

beforeEach(resetDatabase);
afterAll(() => prisma.$disconnect());

function openStream() {
  const disconnect = new AbortController();
  const request = new NextRequest('http://localhost/api/admin/notifications/stream', { signal: disconnect.signal });
  return { disconnect, response: GET(request) };
}

/** Reads the stream until the first `data:` event is complete. */
async function firstEvent(reader: ReadableStreamDefaultReader<Uint8Array>): Promise<string> {
  const decoder = new TextDecoder();
  let text = '';
  while (!/data: .*\n\n/.test(text)) {
    const { value, done } = await reader.read();
    if (done) break;
    text += decoder.decode(value);
  }
  return text;
}

describe('admin notification stream', () => {
  it('sends the reconnect delay and the unread list first, newest first', async () => {
    await prisma.adminNotification.create({ data: { title: 'Older', message: 'm', createdAt: new Date('2026-11-01') } });
    await prisma.adminNotification.create({ data: { title: 'Newer', message: 'm', createdAt: new Date('2026-11-02') } });
    await prisma.adminNotification.create({ data: { title: 'Read', message: 'm', isRead: true } });

    const { disconnect, response } = openStream();
    const reader = (await response).body!.getReader();
    const text = await firstEvent(reader);
    disconnect.abort();

    expect(text).toMatch(/^retry: \d+\n/);
    const unread = JSON.parse(text.match(/data: (.*)\n\n/)![1]) as { title: string }[];
    expect(unread.map((n) => n.title)).toEqual(['Newer', 'Older']);
  });

  it('ends right away when the browser disconnects, not after the next poll', async () => {
    const { disconnect, response } = openStream();
    const reader = (await response).body!.getReader();
    await firstEvent(reader);
    const startedAt = Date.now();
    disconnect.abort();
    let done = false;
    while (!done) ({ done } = await reader.read());
    expect(Date.now() - startedAt).toBeLessThan(2_000);
  });

  it('client users cannot open it', async () => {
    const login = await prisma.user.create({ data: { email: 'hr@stream.test', role: 'EMPLOYER' } });
    actAsClientUser(login.id, null);
    expect((await openStream().response).status).toBe(401);
  });
});
