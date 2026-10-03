import { useTranslations } from "next-intl";
import Reveal from "@/components/motion/Reveal";
import ContactForm from "./ContactForm";
import ContactImage from "./ContactImage";

export default function ContactHero() {
  const t = useTranslations("pages.contact");

  return (
    <section className="overflow-x-clip pt-5 sm:pt-10">
      <div className="container-site">
        <div className="grid grid-cols-1 gap-5 lg:grid-cols-2 lg:gap-12.5">
          <Reveal effect="slideInBottom">
            <ContactImage src="/images/contact/contact.jpg" alt={t("image_alt")} />
          </Reveal>
          <Reveal effect="slideInBottom" delay={200}>
            <div className="mb-10">
              <h1 className="mb-4 text-4xl sm:text-5xl lg:text-6xl">{t("title")}</h1>
              <p className="text-pretty">{t("description")}</p>
            </div>
            <ContactForm />
          </Reveal>
        </div>
      </div>
    </section>
  );
}
