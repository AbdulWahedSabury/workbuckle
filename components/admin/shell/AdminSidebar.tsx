import type { ReactNode } from "react";
import Logo from "@/components/ui/Logo";
import type { Role } from "@/lib/generated/prisma/enums";
import AccountCard from "./AccountCard";
import AdminNav from "./AdminNav";
import ThemeToggle from "./ThemeToggle";

/**
 * Sidebar body shared by the desktop <aside> and the mobile drawer. Header and
 * footer are pinned and only the nav scrolls, so the account card and
 * sign-out stay on screen however short the viewport is.
 */
export default function AdminSidebar({
  user,
  headerAction,
  onNavigate,
}: {
  user: { email: string; role: Role };
  /** Right side of the header: the notification bell, or the drawer's close button. */
  headerAction?: ReactNode;
  onNavigate?: () => void;
}) {
  return (
    <div className="flex h-full min-h-0 flex-col">
      <div className="flex h-20 shrink-0 items-center gap-2 border-b border-line px-5 font-heading text-lg font-semibold text-ink">
        <Logo href="/admin" />
        {headerAction && <div className="ml-auto shrink-0">{headerAction}</div>}
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-3 py-6 scrollbar-thin">
        <AdminNav role={user.role} onNavigate={onNavigate} />
      </div>

      <div className="flex shrink-0 flex-col gap-3 border-t border-line p-4">
        <ThemeToggle />
        <AccountCard user={user} />
      </div>
    </div>
  );
}
