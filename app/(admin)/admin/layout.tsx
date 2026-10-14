import type { Metadata } from "next";
import FlashToaster from "@/components/admin/FlashToaster";
import { readFlash } from "@/lib/admin/flash-server";

// Shared by the login page and the (panel) group. Auth and the sidebar shell
// live in (panel)/layout.tsx so /admin/login renders without them.
export const metadata: Metadata = {
  title: { default: "Admin", template: "%s · Admin | Work Buckle" },
  robots: { index: false, follow: false },
};

export default async function AdminRootLayout({ children }: LayoutProps<"/admin">) {
  // Re-rendered whenever a Server Action sets the flash cookie, so toasts
  // queued with setFlash() show up here even across a redirect.
  const flash = await readFlash();
  return (
    <>
      {children}
      <FlashToaster flash={flash} />
    </>
  );
}
