import type { Metadata } from "next";
import { cookies } from "next/headers";
import AdminShell from "@/components/admin/shell/AdminShell";
import { ADMIN_THEME_COOKIE, parseAdminTheme } from "@/lib/admin/theme";

export const metadata: Metadata = {
  title: { default: "Admin", template: "%s · Admin | Work Buckle" },
  robots: { index: false, follow: false },
};

export default async function AdminLayout({ children }: LayoutProps<"/admin">) {
  const theme = parseAdminTheme((await cookies()).get(ADMIN_THEME_COOKIE)?.value);
  return <AdminShell theme={theme}>{children}</AdminShell>;
}
