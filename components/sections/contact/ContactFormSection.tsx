import { useTranslations } from "next-intl";
import Reveal from "@/components/motion/Reveal";
import ContactForm from "./ContactForm";
import ContactImage from "./ContactImage";

/** The contact form beside a photo on a dark panel that bleeds out to the left edge of the viewport. */
export default function ContactFormSection() {
  const t = useTranslations("pages.contact");

  return (
    <section className="overflow-x-clip pt-[60px] md:pt-[75px] lg:pt-[90px]">
      <div className="container-site">
        <div className="grid grid-cols-1 gap-5 lg:grid-cols-2 lg:gap-12.5">
          <Reveal effect="slideInBottom">
            <ContactImage src="/images/contact/contact.jpg" alt={t("image_alt")} />
          </Reveal>
          <Reveal effect="slideInBottom" delay={200}>
            <h2 className="mb-8 text-3xl sm:text-4xl lg:text-5xl">{t("form_title")}</h2>
            <ContactForm />
          </Reveal>
        </div>
      </div>
    </section>
  );
}
