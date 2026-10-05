// Admin color theme. Shared by the server layout (reads the cookie so the
// first paint is already correct) and the client toggle (writes it).

export const ADMIN_THEMES = ["light", "dark", "system"] as const;

export type AdminTheme = (typeof ADMIN_THEMES)[number];

export const ADMIN_THEME_COOKIE = "admin-theme";

/** Falls back to following the OS for a missing or unknown cookie value. */
export function parseAdminTheme(value: string | undefined): AdminTheme {
  return ADMIN_THEMES.includes(value as AdminTheme) ? (value as AdminTheme) : "system";
}

/** Scoped to /admin so the public site never receives it. */
export function adminThemeCookie(theme: AdminTheme): string {
  return `${ADMIN_THEME_COOKIE}=${theme}; path=/admin; max-age=31536000; SameSite=Lax`;
}
