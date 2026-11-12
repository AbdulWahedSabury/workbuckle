// Client-safe: the sidebar filters its links with this, and the server
// enforces the same rules in lib/admin/auth.ts. Only ADMIN can change data;
// every other panel role is read-only.
import { Role } from '@/lib/generated/prisma/enums';

export type AdminSection =
  | 'dashboard'
  | 'jobs'
  | 'candidates'
  /** Everyone in the talent pool, with or without a job. Not for client users. */
  | 'people'
  /** The live "new application" feed, which covers every client's jobs. */
  | 'notifications'
  | 'campaigns'
  | 'categories'
  | 'positions'
  | 'jobTypes'
  | 'cities'
  | 'clients'
  | 'faqs'
  | 'settings'
  | 'users';

const ALL_SECTIONS: readonly AdminSection[] = [
  'dashboard',
  'jobs',
  'candidates',
  'people',
  'notifications',
  'campaigns',
  'categories',
  'positions',
  'jobTypes',
  'cities',
  'clients',
  'faqs',
  'settings',
  'users',
];

/** Sections each role can open. A role missing here (USER) can't sign in. */
const VIEWABLE: Partial<Record<Role, readonly AdminSection[]>> = {
  [Role.ADMIN]: ALL_SECTIONS,
  [Role.VIEWER]: ALL_SECTIONS.filter((s) => s !== 'users'),
  // Scoped to their own client in lib/admin/scope.ts: its jobs, and only the
  // applications an admin has submitted to it.
  [Role.EMPLOYER]: ['dashboard', 'jobs', 'candidates'],
};

export const ROLE_OPTIONS: readonly { value: Role; label: string; description: string }[] = [
  { value: Role.ADMIN, label: 'Admin', description: 'Full access, including users.' },
  { value: Role.EMPLOYER, label: 'Client', description: 'Read-only: their own jobs and the candidates submitted to them.' },
  { value: Role.VIEWER, label: 'Viewer', description: 'Read-only: everything except users.' },
  { value: Role.USER, label: 'No access', description: "Can't sign in to the panel." },
];

export function roleLabel(role: Role): string {
  return ROLE_OPTIONS.find((o) => o.value === role)?.label ?? role;
}

export function isRole(value: unknown): value is Role {
  // Not `value in Role`: that also accepts inherited names like "toString".
  return Object.values<unknown>(Role).includes(value);
}

/** Can sign in to /admin at all. */
export function isPanelRole(role: unknown): role is Role {
  return isRole(role) && VIEWABLE[role] !== undefined;
}

export function canView(role: Role, section: AdminSection): boolean {
  return VIEWABLE[role]?.includes(section) ?? false;
}

export function canEdit(role: Role): boolean {
  return role === Role.ADMIN;
}
