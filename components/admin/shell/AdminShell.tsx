import type { ReactNode } from "react";
import type { AdminTheme } from "@/lib/admin/theme";
import type { Role } from "@/lib/generated/prisma/enums";
import AdminNotificationDropdown from "../AdminNotificationDropdown";
import AdminNotificationsProvider from "../notifications/AdminNotificationsProvider";
import AdminMobileNav from "./AdminMobileNav";
import AdminSidebar from "./AdminSidebar";
import AdminThemeProvider from "./AdminThemeProvider";

export default function AdminShell({
  theme,
  user,
  children,
}: {
  theme: AdminTheme;
  user: { email: string; role: Role };
  children: ReactNode;
}) {
  return (
    <AdminThemeProvider initialTheme={theme} className="min-h-svh bg-gray-3 lg:flex">
      <AdminNotificationsProvider>
        <a
          href="#admin-main"
          className="sr-only z-50 rounded-full bg-ink px-4 py-2 text-sm text-white focus:not-sr-only focus:fixed focus:top-3 focus:left-3"
        >
          Skip to content
        </a>

        {/*
          The bell's dropdown extends past the sidebar over <main>, so: no
          overflow here, and z-30 because `sticky` makes this a stacking
          context. Without it the dropdown's z-50 only counts inside the
          aside, and positioned content in <main> (up to z-20) paints on top.
        */}
        <aside className="hidden border-r border-line bg-white lg:sticky lg:top-0 lg:z-30 lg:block lg:h-svh lg:w-80 lg:shrink-0">
          <AdminSidebar user={user} headerAction={<AdminNotificationDropdown align="left" />} />
        </aside>

        <div className="flex min-w-0 flex-1 flex-col">
          <AdminMobileNav user={user} />
          <main id="admin-main" className="w-full max-w-6xl flex-1 px-4 py-8 sm:px-6 lg:px-10 lg:py-10">
            {children}
          </main>
        </div>
      </AdminNotificationsProvider>
    </AdminThemeProvider>
  );
}
