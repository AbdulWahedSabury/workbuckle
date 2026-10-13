import type { Metadata } from "next";
import { Inter, Poppins } from "next/font/google";
import localFont from "next/font/local";
import "./globals.css";
import { NextIntlClientProvider } from "next-intl";
import QueryProvider from "@/providers/QueryProvider";
import SiteSettingProvider from "@/providers/SiteSettingProvider";
import { Toaster } from "sonner";
import { getSiteSetting } from "@/lib/site-settings";
import JsonLd from "@/components/seo/JsonLd";
import { organizationSchema } from "@/components/seo/organizationSchema";

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
  const setting = await getSiteSetting();
  return {
    title: {
      default: setting.meta_title || "Work Buckle — Find work that fits",
      template: `%s | ${setting.name}`,
    },
    description:
      setting.meta_description ||
      "Work Buckle connects job seekers with hiring teams. Browse featured roles, top companies, and career categories.",
  };
}

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const setting = await getSiteSetting();

  return (
    <html
      lang="en"
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
