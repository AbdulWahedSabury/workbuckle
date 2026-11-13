import { notFound } from "next/navigation";
import { hasLocale } from "next-intl";
import { setRequestLocale } from "next-intl/server";
import MaintenanceNotice from "@/components/layout/MaintenanceNotice";
import SiteShell from "@/components/layout/SiteShell";
import { routing } from "@/i18n/routing";
import { getMaintenance } from "@/lib/site-settings";

// proxy.ts rewrites every public URL to /<locale>/..., so `locale` is "en" for
// /about and "el" for /el/about. Anything else (/fr/about) is a 404.
export default async function SiteLayout({ children, params }: LayoutProps<"/[locale]">) {
  const { locale } = await params;
  if (!hasLocale(routing.locales, locale)) notFound();
  setRequestLocale(locale);

  // The admin panel sits outside this layout, so it stays reachable to switch maintenance off.
  const maintenance = await getMaintenance();
  if (maintenance.on) return <MaintenanceNotice message={maintenance.message} />;

  return <SiteShell>{children}</SiteShell>;
}
