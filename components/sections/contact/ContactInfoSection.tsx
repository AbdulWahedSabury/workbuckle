import { useTranslations } from "next-intl";
import SocialLinks from "@/components/layout/SocialLinks";
import RevealSection from "@/components/motion/RevealSection";
import SectionHeading from "@/components/ui/SectionHeading";
import { CONTACT_INFO_ITEMS } from "@/constants/contactInfo";
import ContactInfoCard from "./ContactInfoCard";

export default function ContactInfoSection() {
  const t = useTranslations("pages.contact.info");

  return (
    <RevealSection className="section-spacing">
      <div className="container-site">
        <SectionHeading align="center">{t("title")}</SectionHeading>
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4 lg:gap-10">
          {CONTACT_INFO_ITEMS.map(({ id, icon, value, href }) => (
            <ContactInfoCard key={id} icon={icon} title={t(id)}>
              {id === "social" ? (
                <SocialLinks variant="social" />
              ) : href ? (
                <a href={href} className="transition-colors duration-300 hover:text-primary">
                  {value}
                </a>
              ) : (
                <p>{value}</p>
              )}
            </ContactInfoCard>
          ))}
        </div>
      </div>
    </RevealSection>
  );
}
