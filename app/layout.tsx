import type { Metadata } from "next";
import { Inter, Poppins, Roboto } from "next/font/google";
import "./globals.css";
import Header from "@/components/layout/Header";
import { NextIntlClientProvider } from "next-intl";
import Footer from "@/components/layout/Footer";
import MotionProvider from "@/components/motion/MotionProvider";
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

const roboto = Roboto({
  weight: ["400", "500"],
  subsets: ["latin"],
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
      className={`h-full ${inter.variable} ${poppins.variable} ${roboto.variable}`}
    >
      <body className="antialiased">
        <QueryProvider>
          <NextIntlClientProvider>
            <Header />
            <MotionProvider>
              <main className="flex-1">{children}</main>
            </MotionProvider>
            <Footer />
          </NextIntlClientProvider>
        </QueryProvider>
        <Toaster />
      </body>
    </html>
  );
}
