import type { Metadata } from "next";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import Logo from "@/components/ui/Logo";
import LoginForm from "@/components/admin/LoginForm";
import AdminThemeProvider from "@/components/admin/shell/AdminThemeProvider";
import { cardClass } from "@/components/admin/styles";
import { getPanelUser } from "@/lib/admin/auth";
import { ADMIN_THEME_COOKIE, parseAdminTheme } from "@/lib/admin/theme";

export const metadata: Metadata = { title: "Sign in" };

export default async function AdminLoginPage({ searchParams }: PageProps<"/admin/login">) {
  // DB-checked, so a user whose access was removed but who still holds a
  // valid token sees the form instead of bouncing between here and the panel.
  if (await getPanelUser()) redirect("/admin");

  const { callbackUrl } = await searchParams;
  const theme = parseAdminTheme((await cookies()).get(ADMIN_THEME_COOKIE)?.value);

  return (
    <AdminThemeProvider
      initialTheme={theme}
      className="flex min-h-svh items-center justify-center bg-gray-3 px-4 py-12"
    >
      <main className={`${cardClass} w-full max-w-md p-6 sm:p-8`}>
        <div className="mb-8 flex items-center gap-2 font-heading text-lg font-semibold text-ink">
          <Logo href="/" />
          <span className="rounded-full bg-primary/15 px-2 py-0.5 text-[11px] font-semibold tracking-wider uppercase">
            Admin
          </span>
        </div>
        <h1 className="mb-1 text-2xl text-ink">Sign in</h1>
        <p className="mb-6 text-sm text-gray-2">Use the account an administrator created for you.</p>
        <LoginForm callbackUrl={typeof callbackUrl === "string" ? callbackUrl : undefined} />
      </main>
    </AdminThemeProvider>
  );
}
