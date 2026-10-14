'use server';

import { AuthError } from 'next-auth';
import { signIn, signOut } from '@/auth';
import { ADMIN_LOGIN_PATH } from '@/auth.config';
import type { ActionState } from '@/lib/admin/action-state';
import { clearFlash, setFlash } from '@/lib/admin/flash-server';

/**
 * Auth.js passes `callbackUrl` as an absolute URL. Keep only its path, and
 * only if it's an admin page, so it can't become an open redirect.
 */
function safeAdminRedirect(value: FormDataEntryValue | null): string {
  if (typeof value !== 'string') return '/admin';
  try {
    const { pathname, search } = new URL(value, 'http://n');
    const isAdminPath = pathname === '/admin' || pathname.startsWith('/admin/');
    return isAdminPath && pathname !== ADMIN_LOGIN_PATH ? `${pathname}${search}` : '/admin';
  } catch {
    return '/admin';
  }
}

export async function adminSignIn(
  _prev: ActionState,
  formData: FormData
): Promise<ActionState> {
  const email = String(formData.get('email') ?? '');
  // Queued up front: a successful signIn() ends in a redirect, not a return.
  await setFlash('Signed in.');
  try {
    await signIn('credentials', {
      email,
      password: formData.get('password'),
      redirectTo: safeAdminRedirect(formData.get('callbackUrl')),
    });
  } catch (error) {
    // A successful sign-in throws Next's redirect; only Auth.js errors are failures.
    if (error instanceof AuthError) {
      await clearFlash();
      return {
        message:
          error.type === 'CredentialsSignin'
            ? 'Invalid email or password.'
            : 'Something went wrong. Please try again.',
        values: { email },
      };
    }
    throw error;
  }
  return {};
}

export async function adminSignOut(): Promise<void> {
  await setFlash('Signed out.');
  await signOut({ redirectTo: ADMIN_LOGIN_PATH });
}
