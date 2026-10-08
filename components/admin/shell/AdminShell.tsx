import type { ReactNode } from "react";
import Logo from "@/components/ui/Logo";
import type { AdminTheme } from "@/lib/admin/theme";
import type { Role } from "@/lib/generated/prisma/enums";
import AdminMobileNav from "./AdminMobileNav";
import AdminNav from "./AdminNav";
import AdminThemeProvider from "./AdminThemeProvider";
import SignOutButton from "./SignOutButton";
import ThemeToggle from "./ThemeToggle";
import ViewSiteLink from "./ViewSiteLink";

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
      <a
        href="#admin-main"
        className="sr-only z-50 rounded-full bg-ink px-4 py-2 text-sm text-white focus:not-sr-only focus:fixed focus:top-3 focus:left-3"
      >
        Skip to content
      </a>

      <aside className="hidden border-r border-line bg-white lg:sticky lg:top-0 lg:flex lg:h-svh lg:w-72 lg:shrink-0 lg:flex-col lg:gap-10 lg:p-6">
        <div className="flex items-center gap-2 px-2 font-heading text-lg font-semibold text-ink">
          <Logo href="/admin" />
          <span className="rounded-full bg-primary/15 px-2 py-0.5 text-[11px] font-semibold tracking-wider uppercase">
            Admin
          </span>
        </div>
        <AdminNav role={user.role} />
        <div className="mt-auto flex flex-col gap-4">
          <ThemeToggle />
          <ViewSiteLink />
          <SignOutButton user={user} />
        </div>
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        <AdminMobileNav user={user} />
        <main id="admin-main" className="w-full max-w-6xl flex-1 px-4 py-8 sm:px-6 lg:px-10 lg:py-10">
          {children}
        </main>
      </div>
    </AdminThemeProvider>
  );
}
