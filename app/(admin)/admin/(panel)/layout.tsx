import { cookies } from "next/headers";
import AdminShell from "@/components/admin/shell/AdminShell";
import { requirePanelUser } from "@/lib/admin/auth";
import { ADMIN_THEME_COOKIE, parseAdminTheme } from "@/lib/admin/theme";

export default async function AdminPanelLayout({ children }: LayoutProps<"/admin">) {
  // Layouts don't re-render on every client navigation, so this isn't the
  // only check: proxy.ts runs per request, pages and queries call
  // requireView(), and Server Actions call requireAdmin().
  const user = await requirePanelUser();
  const theme = parseAdminTheme((await cookies()).get(ADMIN_THEME_COOKIE)?.value);
  return (
    <AdminShell theme={theme} user={{ email: user.email, role: user.role }}>
      {children}
    </AdminShell>
  );
}
