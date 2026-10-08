import { LogOut } from "lucide-react";
import { adminSignOut } from "@/lib/admin/actions/auth";
import { roleLabel } from "@/lib/auth/roles";
import type { Role } from "@/lib/generated/prisma/enums";
import { cn } from "@/lib/utils";
import { secondaryButtonClass } from "../styles";

export default function SignOutButton({
  user,
  className,
}: {
  user: { email: string; role: Role };
  className?: string;
}) {
  return (
    <form action={adminSignOut} className={cn("flex flex-col gap-2", className)}>
      <p className="truncate px-4 text-xs text-gray-2" title={user.email}>
        <span className="font-semibold text-ink">{user.email}</span> · {roleLabel(user.role)}
      </p>
      <button type="submit" className={cn(secondaryButtonClass, "w-full")}>
        <LogOut aria-hidden="true" />
        Sign out
      </button>
    </form>
  );
}
