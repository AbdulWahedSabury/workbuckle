import type { Metadata } from "next";
import ContactHero from "@/components/sections/contact/ContactHero";
import ContactMain from "@/components/sections/contact/ContactMain";
import Faq from "@/components/sections/contact/Faq";

export const metadata: Metadata = {
  title: "Contact",
  description:
    "Reach out to the Work Buckle team — we're here to understand your needs and provide tailored solutions.",
};

export default async function ContactPage() {
  return (
    <>
      <ContactHero />
      <ContactMain />
      <Faq />
    </>
  );
}
