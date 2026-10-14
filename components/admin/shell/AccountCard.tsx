import { LogOut } from "lucide-react";
import { adminSignOut } from "@/lib/admin/actions/auth";
import { roleLabel } from "@/lib/auth/roles";
import type { Role } from "@/lib/generated/prisma/enums";
import { cn } from "@/lib/utils";
import { secondaryButtonClass } from "../styles";

/** Signed-in user and sign-out, pinned to the bottom of the sidebar. */
export default function AccountCard({
  user,
  className,
}: {
  user: { email: string; role: Role };
  className?: string;
}) {
  return (
    <div className={cn("flex flex-col gap-3 rounded-sm-card bg-gray-3 p-3", className)}>
      <div className="flex min-w-0 items-center gap-3">
        <span
          aria-hidden="true"
          className="flex size-9 shrink-0 items-center justify-center rounded-full bg-ink text-sm font-semibold text-white"
        >
          {user.email.charAt(0).toUpperCase()}
        </span>
        <div className="min-w-0">
          <p className="truncate text-sm font-semibold text-ink" title={user.email}>
            {user.email}
          </p>
          <p className="text-xs text-gray-2">{roleLabel(user.role)}</p>
        </div>
      </div>
      <form action={adminSignOut}>
        <button type="submit" className={cn(secondaryButtonClass, "w-full")}>
          <LogOut aria-hidden="true" />
          Sign out
        </button>
      </form>
    </div>
  );
}
