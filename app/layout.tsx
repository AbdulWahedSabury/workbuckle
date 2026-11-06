import type { Metadata } from "next";
import { Inter, Poppins } from "next/font/google";
import localFont from "next/font/local";
import "./globals.css";
import { hasLocale, NextIntlClientProvider } from "next-intl";
import { getLocale, getTranslations } from "next-intl/server";
import QueryProvider from "@/providers/QueryProvider";
import SiteSettingProvider from "@/providers/SiteSettingProvider";
import { Toaster } from "sonner";
import { getSiteSetting } from "@/lib/site-settings";
import JsonLd from "@/components/seo/JsonLd";
import { organizationSchema } from "@/components/seo/organizationSchema";
import { defaultLocale, locales, LOCALE_OG_TAGS } from "@/types/locale";

const inter = Inter({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--next-font-inter",
});

const poppins = Poppins({
  weight: ["600", "700"],
  subsets: ["latin"],
  variable: "--next-font-poppins",
});

const roboto = localFont({
  src: "./fonts/roboto-latin-variable.woff2",
  weight: "400 500",
  variable: "--next-font-roboto",
});

export async function generateMetadata(): Promise<Metadata> {
  const [setting, locale, t] = await Promise.all([
    getSiteSetting(),
    getLocale(),
    getTranslations("Metadata.site"),
  ]);
  // The admin's SEO title and description are written in English, so other
  // languages use the translated defaults instead.
  const useSetting = locale === defaultLocale;
  return {
    title: {
      default: (useSetting && setting.meta_title) || t("title"),
      template: `%s | ${setting.name}`,
    },
    description: (useSetting && setting.meta_description) || t("description"),
    openGraph: { locale: LOCALE_OG_TAGS[hasLocale(locales, locale) ? locale : defaultLocale] },
  };
}

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // Set by proxy.ts from the URL; the admin panel always gets the default (English).
  const [setting, locale] = await Promise.all([getSiteSetting(), getLocale()]);

  return (
    <html
      lang={locale}
      data-scroll-behavior="smooth"
      className={`h-full ${inter.variable} ${poppins.variable} ${roboto.variable}`}
    >
      <body className="antialiased"
      suppressHydrationWarning>
        <JsonLd data={organizationSchema(setting)} />
        <QueryProvider>
          <NextIntlClientProvider>
            <SiteSettingProvider setting={setting}>
              {children}
            </SiteSettingProvider>
          </NextIntlClientProvider>
        </QueryProvider>
        <Toaster />
      </body>
    </html>
  );
}
