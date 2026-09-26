import type { Metadata } from "next";
import { DM_Sans, Poppins } from "next/font/google";
import "./globals.css";
import Header from "@/components/layout/Header";
import { NextIntlClientProvider } from "next-intl";
import Footer from "@/components/layout/Footer";
import MotionProvider from "@/components/motion/MotionProvider";

const poppins = Poppins({
  variable: "--font-poppins",
  weight: ["100", "200", "300", "400", "500", "600", "700", "800", "900"],
});
const inter = DM_Sans({
  variable: "--font-dm-sans",
  subsets: ["latin"],
  weight: ["500", "600", "700"],
});

export const metadata: Metadata = {
  title: {
    default: "Work Buckle — Find work that fits",
    template: "%s | Work Buckle",
  },
  description:
    "Work Buckle connects job seekers with hiring teams. Browse featured roles, top companies, and career categories.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" className="h-full">
      <body
        className={`${poppins.variable} ${inter.variable} flex min-h-dvh flex-col antialiased`}
      >
        <NextIntlClientProvider>
          <Header />
          <MotionProvider>
            <main className="flex-1">{children}</main>
          </MotionProvider>
          <Footer />
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
