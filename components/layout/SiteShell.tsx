import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import MotionProvider from "@/components/motion/MotionProvider";

// Public-site chrome. Shared by app/(site)/layout.tsx and the root not-found page.
export default function SiteShell({ children }: { children: React.ReactNode }) {
  return (
    <>
      <Header />
      <MotionProvider>
        <main className="flex-1">{children}</main>
      </MotionProvider>
      <Footer />
    </>
  );
}
