"use client";

import { createContext, use, useState, type ReactNode } from "react";
import { adminThemeCookie, type AdminTheme } from "@/lib/admin/theme";

type AdminThemeContextValue = { theme: AdminTheme; setTheme: (theme: AdminTheme) => void };

const AdminThemeContext = createContext<AdminThemeContextValue | null>(null);

export function useAdminTheme() {
  const ctx = use(AdminThemeContext);
  if (!ctx) throw new Error("useAdminTheme must be used inside <AdminThemeProvider>");
  return ctx;
}

/**
 * Renders the admin root with `data-admin-theme`; the token overrides in
 * app/globals.css key off that attribute. The initial value comes from the
 * cookie on the server, so there's no flash and nothing to reconcile.
 */
export default function AdminThemeProvider({
  initialTheme,
  className,
  children,
}: {
  initialTheme: AdminTheme;
  className?: string;
  children: ReactNode;
}) {
  const [theme, setThemeState] = useState(initialTheme);

  const setTheme = (next: AdminTheme) => {
    setThemeState(next);
    document.cookie = adminThemeCookie(next);
  };

  return (
    <AdminThemeContext value={{ theme, setTheme }}>
      <div data-admin-theme={theme} className={className}>
        {children}
      </div>
    </AdminThemeContext>
  );
}
