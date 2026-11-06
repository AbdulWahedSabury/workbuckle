import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import ContactFormSection from "@/components/sections/contact/ContactFormSection";
import ContactHero from "@/components/sections/contact/ContactHero";
import ContactInfoSection from "@/components/sections/contact/ContactInfoSection";
import Faq from "@/components/sections/contact/Faq";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("Metadata.pages.contact");
  return { title: t("title"), description: t("description") };
}

export default function ContactPage() {
  return (
    <>
      <ContactHero />
      <ContactFormSection />
      <ContactInfoSection />
      <Faq />
    </>
  );
}
