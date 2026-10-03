import type { Metadata } from "next";
import ContactHero from "@/components/sections/contact/ContactHero";
import ContactInfoSection from "@/components/sections/contact/ContactInfoSection";
import Faq from "@/components/sections/contact/Faq";

export const metadata: Metadata = {
  title: "Contact",
  description:
    "Reach out to the Work Buckle team — we're here to understand your needs and provide tailored solutions.",
};

export default function ContactPage() {
  return (
    <>
      <ContactHero />
      <ContactInfoSection />
      <Faq />
    </>
  );
}
