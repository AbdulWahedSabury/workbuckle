import 'server-only';
import { cookies } from 'next/headers';
import { FLASH_COOKIE, FLASH_COOKIE_PATH, parseFlash, type Flash, type FlashType } from '@/lib/admin/flash';

/**
 * Queue a toast for the next render. Setting a cookie in a Server Action
 * re-renders the layouts in the same round trip (redirects included), and
 * the admin layout hands it to <FlashToaster>.
 */
export async function setFlash(message: string, type: FlashType = 'success'): Promise<void> {
  const flash: Flash = { id: crypto.randomUUID(), type, message };
  (await cookies()).set(FLASH_COOKIE, JSON.stringify(flash), {
    path: FLASH_COOKIE_PATH,
    // Only needs to survive one redirect; the toaster deletes it right away.
    maxAge: 60,
    sameSite: 'lax',
    // Read and cleared by client JS; it only ever holds a toast message.
    httpOnly: false,
  });
}

export async function clearFlash(): Promise<void> {
  (await cookies()).delete({ name: FLASH_COOKIE, path: FLASH_COOKIE_PATH });
}

export async function readFlash(): Promise<Flash | null> {
  return parseFlash((await cookies()).get(FLASH_COOKIE)?.value);
}
