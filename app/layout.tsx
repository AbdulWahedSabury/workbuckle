import type { Metadata } from "next";
import { Inter, Poppins } from "next/font/google";
import localFont from "next/font/local";
import "./globals.css";
import { NextIntlClientProvider } from "next-intl";
import QueryProvider from "@/providers/QueryProvider";
import { Toaster } from "sonner";

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

// Self-hosted: next/font/google fails to resolve Roboto's font files on Vercel's Turbopack build.
// Latin-subset variable font from Google Fonts (covers en + de).
const roboto = localFont({
  src: "./fonts/roboto-latin-variable.woff2",
  weight: "400 500",
  variable: "--next-font-roboto",
});

export const metadata: Metadata = {
  title: {
    default: "Work Buckle — Find work that fits",
    template: "%s | Work Buckle",
  },
  description:
    "Work Buckle connects job seekers with hiring teams. Browse featured roles, top companies, and career categories.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html
      lang="en"
      data-scroll-behavior="smooth"
      className={`h-full ${inter.variable} ${poppins.variable} ${roboto.variable}`}
    >
      <body className="antialiased" 
      suppressHydrationWarning>
        <QueryProvider>
          <NextIntlClientProvider>
            {children}
          </NextIntlClientProvider>
        </QueryProvider>
        <Toaster />
      </body>
    </html>
  );
}
