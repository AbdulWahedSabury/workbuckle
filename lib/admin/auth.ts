/**
 * Single choke point for admin authorization. Every admin page and Server
 * Action calls this, so wiring up real auth later only touches this file.
 *
 * TODO: replace with a real session check that loads the User and verifies
 * `role === Role.ADMIN`. Until then the admin panel is open to anyone who can
 * reach it, so it is blocked in production unless explicitly opted in.
 */
export async function requireAdmin(): Promise<void> {
  if (
    process.env.NODE_ENV === 'production' &&
    process.env.ADMIN_UNPROTECTED !== 'true'
  ) {
    throw new Error('Unauthorized');
  }
}
