import { notFound } from "next/navigation";
import { hasLocale } from "next-intl";
import { setRequestLocale } from "next-intl/server";
import SiteShell from "@/components/layout/SiteShell";
import { routing } from "@/i18n/routing";

// proxy.ts rewrites every public URL to /<locale>/..., so `locale` is "en" for
// /about and "el" for /el/about. Anything else (/fr/about) is a 404.
export default async function SiteLayout({ children, params }: LayoutProps<"/[locale]">) {
  const { locale } = await params;
  if (!hasLocale(routing.locales, locale)) notFound();
  setRequestLocale(locale);

  return <SiteShell>{children}</SiteShell>;
}
