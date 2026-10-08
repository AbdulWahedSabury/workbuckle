import type { Metadata } from "next";

// Shared by the login page and the (panel) group. Auth and the sidebar shell
// live in (panel)/layout.tsx so /admin/login renders without them.
export const metadata: Metadata = {
  title: { default: "Admin", template: "%s · Admin | Work Buckle" },
  robots: { index: false, follow: false },
};

export default function AdminRootLayout({ children }: LayoutProps<"/admin">) {
  return children;
}
