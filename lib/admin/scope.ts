import 'server-only';
import type { Prisma } from '@/lib/generated/prisma/client';
import { Role } from '@/lib/generated/prisma/enums';
import type { PanelUser } from '@/lib/admin/auth';

// Row-level scoping for client (EMPLOYER) users. Every query that returns jobs
// or applications to the panel merges one of these into its `where`, so a
// client user can't load another client's data even by guessing an id.
// Admins and viewers get an empty filter (everything).

/** Matches no rows: an EMPLOYER account not yet linked to a client sees nothing. */
const NOTHING = { id: { in: [] as string[] } };

export const isClientUser = (user: Pick<PanelUser, 'role'>): boolean => user.role === Role.EMPLOYER;

/**
 * Combine a scope with a query's own filter. Always use this rather than
 * spreading: a spread lets the query's keys (e.g. `id`) overwrite the scope's.
 */
export function scoped<W extends object>(scope: W, where: W = {} as W): { AND: W[] } {
  return { AND: [scope, where] };
}

/** Jobs this user may see. */
export function jobScope(user: PanelUser): Prisma.JobWhereInput {
  if (!isClientUser(user)) return {};
  return user.clientId ? { clientId: user.clientId } : NOTHING;
}

/** Applications this user may see: for a client, its own jobs, and only once submitted to it. */
export function applicationScope(user: PanelUser): Prisma.JobApplicationWhereInput {
  if (!isClientUser(user)) return {};
  return user.clientId ? { job: { clientId: user.clientId }, submittedAt: { not: null } } : NOTHING;
}
